// Supabase Edge Function: join-waitlist
// Runtime: Deno + TypeScript
// Responsibilities:
// 1. CORS & Preflight handler
// 2. Validate payload (fullName, email, role)
// 3. Email normalization (trim & lowercase)
// 4. Duplicate prevention & race-condition resilience
// 5. Database insertion into public.waitlist via service role
// 6. Brevo transactional welcome email dispatch
// 7. Standard JSON responses (201 success, 409 duplicate, 400 validation, 500 error)

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface WaitlistPayload {
  fullName?: string;
  full_name?: string;
  email?: string;
  role?: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req: Request) => {
  // 1. Handle CORS Preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // 2. Enforce POST method
  if (req.method !== 'POST') {
    return jsonResponse(
      { success: false, error: 'Method not allowed. Use POST.' },
      405
    );
  }

  try {
    // 3. Parse JSON request body safely
    let payload: WaitlistPayload;
    try {
      payload = await req.json();
    } catch {
      return jsonResponse(
        { success: false, error: 'Invalid JSON request body.' },
        400
      );
    }

    const rawFullName = payload.fullName ?? payload.full_name ?? '';
    const rawEmail = payload.email ?? '';
    const rawRole = payload.role ?? 'believer';

    const trimmedFullName = String(rawFullName).trim();
    const normalizedEmail = String(rawEmail).trim().toLowerCase();
    const trimmedRole = String(rawRole).trim() || 'believer';

    // 4. Validate payload inputs
    if (!trimmedFullName || trimmedFullName.length < 2) {
      return jsonResponse(
        { success: false, error: 'Full name must be at least 2 characters.' },
        400
      );
    }

    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return jsonResponse(
        { success: false, error: 'Please provide a valid email address.' },
        400
      );
    }

    // 5. Initialize Supabase Client with Service Role Key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[join-waitlist] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
      return jsonResponse(
        { success: false, error: 'Something went wrong. Please try again.' },
        500
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 6. Check for duplicate email before insert
    const { data: existingUser, error: queryError } = await supabase
      .from('waitlist')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (queryError) {
      console.error('[join-waitlist] Error querying waitlist for duplicates:', queryError.message);
    }

    if (existingUser) {
      return jsonResponse(
        {
          success: false,
          status: 'duplicate',
          error: "You're already on the GraceGrid waitlist.",
        },
        409
      );
    }

    // 7. Insert new record into public.waitlist table
    const { data: insertedData, error: insertError } = await supabase
      .from('waitlist')
      .insert([
        {
          full_name: trimmedFullName,
          email: normalizedEmail,
          role: trimmedRole,
        },
      ])
      .select('id, full_name, email, role, created_at')
      .single();

    if (insertError) {
      // Postgres error code 23505 = unique_violation
      if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
        return jsonResponse(
          {
            success: false,
            status: 'duplicate',
            error: "You're already on the GraceGrid waitlist.",
          },
          409
        );
      }

      console.error('[join-waitlist] Error inserting into waitlist table:', insertError.message);
      return jsonResponse(
        { success: false, error: 'Something went wrong. Please try again.' },
        500
      );
    }

    // 8. Trigger Brevo Transactional Welcome Email (Server-Side Only)
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    const brevoTemplateIdStr = Deno.env.get('BREVO_TEMPLATE_ID');

    // Extract first name for personalized greeting
    const firstName = trimmedFullName.split(/\s+/)[0] || trimmedFullName;

    if (brevoApiKey && brevoTemplateIdStr) {
      const templateId = Number(brevoTemplateIdStr);

      if (!isNaN(templateId) && templateId > 0) {
        try {
          const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoApiKey,
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              to: [
                {
                  email: normalizedEmail,
                  name: trimmedFullName,
                },
              ],
              templateId: templateId,
              params: {
                firstName: firstName,
                fullName: trimmedFullName,
              },
            }),
          });

          if (!brevoResponse.ok) {
            const errorText = await brevoResponse.text();
            console.error(
              `[join-waitlist] Brevo Transactional Email failed (Status ${brevoResponse.status}):`,
              errorText
            );
          } else {
            console.log(`[join-waitlist] Brevo welcome email dispatched to ${normalizedEmail}`);
          }
        } catch (emailError) {
          console.error(
            '[join-waitlist] Exception during Brevo email dispatch:',
            (emailError as Error).message
          );
          // Do not fail the registration request since database record is successfully stored
        }
      } else {
        console.warn('[join-waitlist] BREVO_TEMPLATE_ID is not a valid positive number. Skipping email dispatch.');
      }
    } else {
      console.warn('[join-waitlist] BREVO_API_KEY or BREVO_TEMPLATE_ID is not configured. Skipping email dispatch.');
    }

    // 9. Return JSON success response (HTTP 201)
    return jsonResponse(
      {
        success: true,
        message: "🎉 Welcome! You're officially on the GraceGrid waitlist.",
        data: {
          id: insertedData.id,
          fullName: insertedData.full_name,
          email: insertedData.email,
          role: insertedData.role,
          createdAt: insertedData.created_at,
        },
      },
      201
    );
  } catch (error) {
    console.error('[join-waitlist] Unhandled Edge Function error:', (error as Error).message);
    return jsonResponse(
      { success: false, error: 'Something went wrong. Please try again.' },
      500
    );
  }
});
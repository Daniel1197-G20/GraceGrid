// Supabase Edge Function: super-task
// Runtime: Deno + TypeScript
//
// Responsibilities:
// 1. Validate payload (fullName and email)
// 2. Check for duplicate emails in public.waitlist
// 3. Save subscriber into PostgreSQL via Supabase Service Role client
// 4. Send Brevo Transactional Welcome Email automatically
// 5. Return structured JSON responses with proper HTTP status codes

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

    // 4. Validate payload inputs (HTTP 400 for invalid payloads)
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

    // 5. Read Environment Secrets
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY');
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    const brevoTemplateIdStr = Deno.env.get('BREVO_TEMPLATE_ID') || '3';
    const brevoSenderEmail =
      Deno.env.get('BREVO_SENDER_EMAIL') ||
      Deno.env.get('ADMIN_ALERT_EMAIL') ||
      Deno.env.get('ADMIN_EMAIL') ||
      'gracegrid4@gmail.com';
    const brevoSenderName = Deno.env.get('BREVO_SENDER_NAME') || 'GraceGrid Sanctuary';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[super-task] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
      return jsonResponse(
        { success: false, error: 'Database service configuration missing.' },
        500
      );
    }

    // 6. Initialize Supabase Client with Service Role Key (server-side only)
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // 7. Check for duplicate email in PostgreSQL (HTTP 409 for duplicate)
    const { data: existingUser, error: queryError } = await supabase
      .from('waitlist')
      .select('id, email')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (queryError) {
      console.warn('[super-task] Duplicate check query warning:', queryError.message);
    }

    if (existingUser) {
      return jsonResponse(
        {
          success: false,
          status: 'duplicate',
          error: "You're already on the GraceGrid waitlist.",
          message: "You're already on the GraceGrid waitlist.",
        },
        409
      );
    }

    // 8. Insert new record into public.waitlist table
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
      if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
        return jsonResponse(
          {
            success: false,
            status: 'duplicate',
            error: "You're already on the GraceGrid waitlist.",
            message: "You're already on the GraceGrid waitlist.",
          },
          409
        );
      }

      console.error('[super-task] Error inserting into waitlist table:', insertError.message);
      return jsonResponse(
        { success: false, error: insertError.message || 'Failed to save to waitlist.' },
        500
      );
    }

    // 9. Send Brevo Transactional Welcome Email
    if (brevoApiKey) {
      const templateId = Number(brevoTemplateIdStr) || 3;
      const firstName = trimmedFullName.split(/\s+/)[0] || trimmedFullName;
      const inviteCode = trimmedFullName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'fellowship';
      const inviteLink = `https://gracegrid.app/?ref=${encodeURIComponent(inviteCode)}`;

      const brevoEmailPayload = {
        templateId: templateId,
        sender: {
          name: brevoSenderName,
          email: brevoSenderEmail,
        },
        to: [
          {
            email: normalizedEmail,
            name: trimmedFullName,
          },
        ],
        params: {
          firstName: firstName,
          FIRSTNAME: firstName,
          fullName: trimmedFullName,
          FULLNAME: trimmedFullName,
          name: trimmedFullName,
          NAME: trimmedFullName,
          email: normalizedEmail,
          role: trimmedRole,
          inviteLink: inviteLink,
          year: new Date().getFullYear(),
        },
      };

      console.log(`[super-task] Dispatching Brevo transactional email (Template: ${templateId}, To: ${normalizedEmail})...`);

      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(brevoEmailPayload),
      });

      const brevoResText = await brevoResponse.text();
      console.log(`[super-task] Brevo API Response (HTTP ${brevoResponse.status}):`, brevoResText);

      // Return HTTP 500 with Brevo error details when email sending fails
      if (!brevoResponse.ok) {
        console.error(`[super-task] Brevo email dispatch failed (${brevoResponse.status}):`, brevoResText);
        return jsonResponse(
          {
            success: false,
            error: `Brevo email dispatch failed: ${brevoResText}`,
            details: brevoResText,
          },
          500
        );
      }
    } else {
      console.warn('[super-task] BREVO_API_KEY is not configured in secrets.');
    }

    // 10. Return JSON success response (HTTP 200)
    return jsonResponse(
      {
        success: true,
        message: "🎉 You're officially on the GraceGrid waitlist!",
        data: {
          id: insertedData.id,
          fullName: insertedData.full_name,
          email: insertedData.email,
          role: insertedData.role,
          createdAt: insertedData.created_at,
        },
      },
      200
    );
  } catch (error) {
    console.error('[super-task] Unhandled error:', (error as Error).message);
    return jsonResponse(
      { success: false, error: 'Something went wrong. Please try again.' },
      500
    );
  }
});

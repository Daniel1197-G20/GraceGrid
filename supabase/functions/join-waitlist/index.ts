// Supabase Edge Function: join-waitlist
// Runtime: Deno + TypeScript
// Responsibilities:
// 1. CORS & Preflight handler
// 2. Validate payload (fullName, email, role)
// 3. Email normalization (trim & lowercase)
// 4. Duplicate prevention & race-condition resilience
// 5. Database insertion into public.waitlist via service role
// 6. Brevo transactional welcome email dispatch to subscriber
// 7. Brevo instant notification alert email to administrator
// 8. Brevo Contact list sync with custom attributes
// 9. Standard JSON responses (201 success, 409 duplicate, 400 validation, 500 error)

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LAUNCH_TARGET = 50;

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

function generateWelcomeEmailHtml({
  firstName,
  trimmedFullName,
  normalizedEmail,
  trimmedRole,
  devPhase,
  inviteLink,
}: {
  firstName: string;
  trimmedFullName: string;
  normalizedEmail: string;
  trimmedRole: string;
  devPhase: string;
  inviteLink: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to GraceGrid</title>
  <style>
    body { margin: 0; padding: 0; background-color: #021e10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f0fdf4; }
    .wrapper { max-width: 600px; margin: 40px auto; background-color: #062c19; border: 1px solid #16a34a33; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { padding: 40px 32px 20px; text-align: center; background: radial-gradient(circle at top, rgba(34, 197, 94, 0.25), transparent 70%); }
    .cross { font-size: 36px; margin-bottom: 12px; }
    .title { font-size: 26px; font-weight: 700; color: #ffffff; margin: 0 0 8px; letter-spacing: -0.5px; }
    .badge { display: inline-block; padding: 4px 14px; background: rgba(212, 175, 55, 0.15); border: 1px solid #d4af37; border-radius: 999px; color: #fef08a; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .body-content { padding: 32px; font-size: 16px; line-height: 1.65; color: #dcfce7; }
    .card-highlight { background: rgba(0,0,0,0.3); border: 1px solid rgba(22, 163, 74, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0; }
    .highlight-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .highlight-label { color: #86efac; }
    .highlight-val { color: #ffffff; font-weight: 600; }
    .btn { display: block; text-align: center; background: linear-gradient(135deg, #16a34a, #15803d); color: #ffffff !important; text-decoration: none; padding: 16px 28px; border-radius: 10px; font-weight: 700; font-size: 16px; margin: 30px 0 20px; box-shadow: 0 8px 20px rgba(22, 163, 74, 0.3); }
    .footer { padding: 24px 32px; background-color: #021a0d; text-align: center; font-size: 13px; color: #4ade8099; border-top: 1px solid rgba(22, 163, 74, 0.2); }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="cross">🕊️</div>
      <div class="badge">${devPhase}</div>
      <h1 class="title">Welcome to GraceGrid</h1>
    </div>
    <div class="body-content">
      <p>Grace and peace to you, <strong>${firstName}</strong>,</p>
      <p>Thank you for stepping into the early access waitlist for <strong>GraceGrid</strong> — a dedicated digital sanctuary built for prayer, live worship, and biblical fellowship free from secular distractions.</p>
      
      <div class="card-highlight">
        <div class="highlight-item">
          <span class="highlight-label">Community Role:</span>
          <span class="highlight-val">${trimmedRole.toUpperCase()}</span>
        </div>
        <div class="highlight-item">
          <span class="highlight-label">Waitlist Status:</span>
          <span class="highlight-val" style="color: #4ade80;">CONFIRMED</span>
        </div>
        <div class="highlight-item">
          <span class="highlight-label">Launch Cohort:</span>
          <span class="highlight-val" style="color: #fef08a;">First 50 Believers Goal</span>
        </div>
      </div>

      <p>We are actively building this sanctuary. You will receive exclusive project development updates directly to <code>${normalizedEmail}</code> as we roll out closed beta invites and new scripture rooms.</p>

      <a href="${inviteLink}" class="btn">Share Your Fellowship Invite Link</a>

      <p style="font-size: 14px; color: #86efac; text-align: center;">
        Your invite link: <br>
        <span style="color: #fef08a; word-break: break-all;">${inviteLink}</span>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} GraceGrid. Designed for the global body of Christ.</p>
      <p>You received this because you registered at gracegrid.app.</p>
    </div>
  </div>
</body>
</html>
`;
}

function generateAdminAlertEmailHtml({
  fullName,
  email,
  role,
  totalCount,
  registeredAt,
}: {
  fullName: string;
  email: string;
  role: string;
  totalCount: number;
  registeredAt: string;
}): string {
  const percent = Math.min(100, Math.round((totalCount / LAUNCH_TARGET) * 100));
  const remaining = Math.max(0, LAUNCH_TARGET - totalCount);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New GraceGrid Registration Alert</title>
  <style>
    body { margin: 0; padding: 0; background-color: #021c0d; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f0fdf4; }
    .wrapper { max-width: 580px; margin: 30px auto; background-color: #062c19; border: 1.5px solid #22c55e55; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    .header { padding: 32px 24px 20px; text-align: center; background: radial-gradient(circle at top, rgba(34, 197, 94, 0.3), transparent 70%); }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(34, 197, 94, 0.2); border: 1px solid #4ade80; border-radius: 999px; color: #86efac; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .title { font-size: 22px; font-weight: 800; color: #ffffff; margin: 10px 0 0; }
    .body { padding: 24px 28px; font-size: 15px; line-height: 1.6; color: #dcfce7; }
    .meta-box { background: rgba(0,0,0,0.35); border: 1px solid rgba(34, 197, 94, 0.25); border-radius: 12px; padding: 18px; margin: 20px 0; }
    .meta-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .meta-row:last-child { border-bottom: none; }
    .meta-lbl { color: #86efac; font-weight: 600; font-size: 13px; }
    .meta-val { color: #ffffff; font-weight: 700; font-size: 14px; }
    .progress-box { background: rgba(2, 28, 13, 0.8); border: 1px solid #d4af3744; border-radius: 10px; padding: 14px; text-align: center; margin: 16px 0; }
    .progress-title { font-size: 13px; color: #fef08a; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .progress-count { font-size: 24px; font-weight: 900; color: #ffffff; margin: 4px 0; }
    .btn { display: block; text-align: center; background: linear-gradient(135deg, #16a34a, #15803d); color: #ffffff !important; text-decoration: none; padding: 14px 24px; border-radius: 10px; font-weight: 700; font-size: 15px; margin: 24px 0 10px; }
    .footer { padding: 20px; background-color: #021a0d; text-align: center; font-size: 12px; color: #4ade8088; border-top: 1px solid rgba(22, 163, 74, 0.2); }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="badge">🔔 Admin Notification Alert</div>
      <h1 class="title">New Believer Joined Waitlist</h1>
    </div>
    <div class="body">
      <p>A new subscriber has officially registered for early access to the GraceGrid sanctuary:</p>

      <div class="meta-box">
        <div class="meta-row">
          <span class="meta-lbl">Full Name:</span>
          <span class="meta-val">${fullName}</span>
        </div>
        <div class="meta-row">
          <span class="meta-lbl">Email:</span>
          <span class="meta-val">${email}</span>
        </div>
        <div class="meta-row">
          <span class="meta-lbl">Community Role:</span>
          <span class="meta-val" style="color: #fef08a;">${role.toUpperCase()}</span>
        </div>
        <div class="meta-row">
          <span class="meta-lbl">Timestamp:</span>
          <span class="meta-val">${registeredAt}</span>
        </div>
      </div>

      <div class="progress-box">
        <div class="progress-title">Cohort Target (50 Believers)</div>
        <div class="progress-count">${totalCount} / ${LAUNCH_TARGET} <span style="font-size: 16px; color: #4ade80;">(${percent}%)</span></div>
        <div style="font-size: 13px; color: #86efac;">${remaining > 0 ? `${remaining} spots remaining` : '🎉 Goal Reached!'}</div>
      </div>

      <a href="https://gracegrid.app/gracegrid-admin/dashboard" class="btn">Open Admin Dashboard</a>
    </div>
    <div class="footer">
      <p>GraceGrid Automated Sentinel &bull; PostgreSQL Row-Level Security Protected</p>
    </div>
  </div>
</body>
</html>
`;
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

    // Get current total subscriber count for admin alert metric
    let totalCount = 1;
    try {
      const { count } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });
      if (typeof count === 'number') {
        totalCount = count;
      }
    } catch (countErr) {
      console.warn('[join-waitlist] Could not get exact count:', countErr);
    }

    // 8. Brevo Integration (Contact List Sync + Welcome Email + Admin Alert Email)
    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    const brevoTemplateIdStr = Deno.env.get('BREVO_TEMPLATE_ID') || '3';
    const brevoListIdStr = Deno.env.get('BREVO_LIST_ID');
    const brevoSenderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || Deno.env.get('ADMIN_ALERT_EMAIL') || Deno.env.get('ADMIN_EMAIL') || 'gracegrid4@gmail.com';
    const brevoSenderName = Deno.env.get('BREVO_SENDER_NAME') || 'GraceGrid Sanctuary';
    const adminAlertEmail = Deno.env.get('ADMIN_ALERT_EMAIL') || Deno.env.get('ADMIN_EMAIL') || 'gracegrid4@gmail.com';

    // Extract first name and clean invite code
    const firstName = trimmedFullName.split(/\s+/)[0] || trimmedFullName;
    const inviteCode = trimmedFullName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'fellowship';
    const inviteLink = `https://gracegrid.app/?ref=${encodeURIComponent(inviteCode)}`;
    const devPhase = 'Phase 1: Pre-Launch Sanctuary';

    if (brevoApiKey) {
      // 8a. Sync / Add Contact to Brevo Contacts List
      try {
        const contactPayload: Record<string, unknown> = {
          email: normalizedEmail,
          attributes: {
            FIRSTNAME: firstName,
            FULLNAME: trimmedFullName,
            ROLE: trimmedRole,
            WAITLIST_STAGE: 'ACTIVE',
            DEV_PHASE: devPhase,
            INVITE_LINK: inviteLink,
          },
          updateEnabled: true,
        };

        if (brevoListIdStr) {
          const listId = Number(brevoListIdStr);
          if (!isNaN(listId) && listId > 0) {
            contactPayload.listIds = [listId];
          }
        }

        const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify(contactPayload),
        });

        if (!contactRes.ok && contactRes.status !== 204 && contactRes.status !== 200 && contactRes.status !== 201) {
          const contactErr = await contactRes.text();
          console.warn(`[join-waitlist] Brevo contact sync warning (${contactRes.status}):`, contactErr);
        } else {
          console.log(`[join-waitlist] Brevo contact synced for ${normalizedEmail}`);
        }
      } catch (contactErr) {
        console.error('[join-waitlist] Brevo contact sync exception:', (contactErr as Error).message);
      }

      // 8b. Dispatch Brevo Transactional Welcome Email to Subscriber
      try {
        const templateId = brevoTemplateIdStr ? Number(brevoTemplateIdStr) : 3;
        let emailDispatched = false;

        // Try template ID dispatch first
        if (templateId && !isNaN(templateId) && templateId > 0) {
          const templatePayload = {
            to: [{ email: normalizedEmail, name: trimmedFullName }],
            templateId: templateId,
            params: {
              firstName: firstName,
              FIRSTNAME: firstName,
              fullName: trimmedFullName,
              FULLNAME: trimmedFullName,
              name: trimmedFullName,
              NAME: trimmedFullName,
              email: normalizedEmail,
              EMAIL: normalizedEmail,
              role: trimmedRole,
              ROLE: trimmedRole,
              inviteLink: inviteLink,
              INVITELINK: inviteLink,
              INVITE_LINK: inviteLink,
              devPhase: devPhase,
              DEV_PHASE: devPhase,
              year: new Date().getFullYear(),
              YEAR: new Date().getFullYear(),
            },
          };

          const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoApiKey,
              'content-type': 'application/json',
            },
            body: JSON.stringify(templatePayload),
          });

          if (brevoResponse.ok) {
            emailDispatched = true;
            console.log(`[join-waitlist] Brevo welcome email dispatched via template ${templateId} to ${normalizedEmail}`);
          } else {
            const errorText = await brevoResponse.text();
            console.warn(
              `[join-waitlist] Brevo template ${templateId} dispatch failed (${brevoResponse.status}): ${errorText}. Attempting HTML fallback...`
            );
          }
        }

        // Fallback to direct HTML welcome email if templateId failed or not set
        if (!emailDispatched) {
          const fallbackPayload = {
            sender: {
              name: brevoSenderName,
              email: brevoSenderEmail,
            },
            to: [{ email: normalizedEmail, name: trimmedFullName }],
            subject: '🕊️ Welcome to GraceGrid — Your Early Access Confirmation',
            htmlContent: generateWelcomeEmailHtml({
              firstName,
              trimmedFullName,
              normalizedEmail,
              trimmedRole,
              devPhase,
              inviteLink,
            }),
          };

          const fallbackRes = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoApiKey,
              'content-type': 'application/json',
            },
            body: JSON.stringify(fallbackPayload),
          });

          if (fallbackRes.ok) {
            console.log(`[join-waitlist] Brevo fallback welcome email dispatched to ${normalizedEmail}`);
          } else {
            console.error(`[join-waitlist] Brevo fallback welcome email failed:`, await fallbackRes.text());
          }
        }
      } catch (emailError) {
        console.error(
          '[join-waitlist] Exception during Brevo welcome email dispatch:',
          (emailError as Error).message
        );
      }

      // 8c. Dispatch Admin Notification Alert Email
      try {
        const adminEmailPayload = {
          sender: {
            name: brevoSenderName,
            email: brevoSenderEmail,
          },
          to: [{ email: adminAlertEmail, name: 'GraceGrid Admin' }],
          subject: `🔔 New GraceGrid Waitlist Signup: ${trimmedFullName} (${trimmedRole})`,
          htmlContent: generateAdminAlertEmailHtml({
            fullName: trimmedFullName,
            email: normalizedEmail,
            role: trimmedRole,
            totalCount,
            registeredAt: new Date().toUTCString(),
          }),
        };

        const adminRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify(adminEmailPayload),
        });

        if (adminRes.ok) {
          console.log(`[join-waitlist] Admin signup alert sent to ${adminAlertEmail}`);
        } else {
          console.warn(`[join-waitlist] Admin alert email warning:`, await adminRes.text());
        }
      } catch (adminErr) {
        console.error('[join-waitlist] Exception dispatching admin alert email:', (adminErr as Error).message);
      }

    } else {
      console.warn('[join-waitlist] BREVO_API_KEY is not configured. Skipping Brevo emails.');
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
          devPhase: devPhase,
          inviteLink: inviteLink,
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

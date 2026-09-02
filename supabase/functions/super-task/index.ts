// Supabase Edge Function: super-task
// Runtime: Deno + TypeScript
//
// Responsibilities:
// 1. Handle CORS Preflight & enforce POST method
// 2. Validate payload (fullName and email)
// 3. Prevent duplicates in PostgreSQL (public.waitlist)
// 4. Save subscriber into PostgreSQL via Supabase Service Role client
// 5. Read BREVO_API_KEY, BREVO_TEMPLATE_ID, and verified sender from Supabase Secrets
// 6. Send TWO Brevo emails:
//    - Welcome email to the subscriber using the configured Brevo template ID
//    - Admin notification email containing the subscriber's full name and email
// 7. Add comprehensive error logging for all Brevo API responses
// 8. Return success only after both emails are sent successfully

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

  return `<!DOCTYPE html>
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
</html>`;
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
    const brevoTemplateIdRaw = Deno.env.get('BREVO_TEMPLATE_ID');
    const brevoSenderEmail =
      Deno.env.get('BREVO_SENDER_EMAIL') ||
      Deno.env.get('ADMIN_ALERT_EMAIL') ||
      Deno.env.get('ADMIN_EMAIL') ||
      'gracegrid4@gmail.com';
    const brevoSenderName = Deno.env.get('BREVO_SENDER_NAME') || 'GraceGrid Sanctuary';
    const adminAlertEmail =
      Deno.env.get('ADMIN_ALERT_EMAIL') ||
      Deno.env.get('ADMIN_EMAIL') ||
      Deno.env.get('BREVO_SENDER_EMAIL') ||
      'gracegrid4@gmail.com';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[super-task] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
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

    // 9. Fetch current subscriber count for admin notification metrics
    let totalCount = 1;
    try {
      const { count } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true });
      if (typeof count === 'number') {
        totalCount = count;
      }
    } catch (countErr) {
      console.warn('[super-task] Could not query total count:', countErr);
    }

    // 10. Validate Brevo Secrets before attempting to send emails
    if (!brevoApiKey) {
      console.error('[super-task] BREVO_API_KEY is not configured in Supabase secrets.');
      return jsonResponse(
        {
          success: false,
          error: 'Brevo API key configuration is missing in secrets.',
        },
        500
      );
    }

    const parsedTemplateId = brevoTemplateIdRaw ? Number(brevoTemplateIdRaw) : 1;
    const templateId = !isNaN(parsedTemplateId) && parsedTemplateId > 0 ? parsedTemplateId : null;

    if (!templateId) {
      console.error('[super-task] Invalid or missing BREVO_TEMPLATE_ID in Supabase secrets:', brevoTemplateIdRaw);
      return jsonResponse(
        {
          success: false,
          error: 'Brevo template ID configuration is missing or invalid in secrets.',
        },
        500
      );
    }

    // 11. Prepare Email 1: Welcome Email to Subscriber via Brevo Template
    const firstName = trimmedFullName.split(/\s+/)[0] || trimmedFullName;
    const inviteCode = trimmedFullName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'fellowship';
    const inviteLink = `https://gracegrid.app/?ref=${encodeURIComponent(inviteCode)}`;
    const devPhase = 'Phase 1: Pre-Launch Sanctuary';
    const registeredTimestamp = insertedData.created_at || new Date().toISOString();

    const welcomeEmailPayload = {
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
        first_name: firstName,
        fullName: trimmedFullName,
        FULLNAME: trimmedFullName,
        full_name: trimmedFullName,
        name: trimmedFullName,
        NAME: trimmedFullName,
        email: normalizedEmail,
        EMAIL: normalizedEmail,
        role: trimmedRole,
        ROLE: trimmedRole,
        inviteLink: inviteLink,
        INVITELINK: inviteLink,
        INVITE_LINK: inviteLink,
        invite_link: inviteLink,
        devPhase: devPhase,
        DEV_PHASE: devPhase,
        year: new Date().getFullYear(),
        YEAR: new Date().getFullYear(),
      },
    };

    // 12. Prepare Email 2: Admin Notification Email containing subscriber name and email
    const adminAlertPayload = {
      sender: {
        name: brevoSenderName,
        email: brevoSenderEmail,
      },
      to: [
        {
          email: adminAlertEmail,
          name: 'GraceGrid Admin',
        },
      ],
      subject: `🔔 New GraceGrid Waitlist Signup: ${trimmedFullName} (${trimmedRole})`,
      htmlContent: generateAdminAlertEmailHtml({
        fullName: trimmedFullName,
        email: normalizedEmail,
        role: trimmedRole,
        totalCount,
        registeredAt: new Date(registeredTimestamp).toUTCString(),
      }),
      textContent: `New GraceGrid Waitlist Signup:\nFull Name: ${trimmedFullName}\nEmail: ${normalizedEmail}\nRole: ${trimmedRole}\nRegistered At: ${new Date(registeredTimestamp).toUTCString()}\nTotal Subscribers: ${totalCount} / ${LAUNCH_TARGET}`,
    };

    console.log(`[super-task] Dispatching Brevo Welcome Email (Template ID: ${templateId}, To: ${normalizedEmail}) and Admin Alert Email (To: ${adminAlertEmail})...`);

    const brevoHeaders = {
      'accept': 'application/json',
      'api-key': brevoApiKey,
      'content-type': 'application/json',
    };

    // 13. Dispatch BOTH emails concurrently via Brevo Transactional API
    const [welcomeRes, adminRes] = await Promise.all([
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: brevoHeaders,
        body: JSON.stringify(welcomeEmailPayload),
      }),
      fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: brevoHeaders,
        body: JSON.stringify(adminAlertPayload),
      }),
    ]);

    const welcomeResText = await welcomeRes.text();
    const adminResText = await adminRes.text();

    console.log(`[super-task] Brevo Welcome Email API Response (HTTP ${welcomeRes.status}):`, welcomeResText);
    console.log(`[super-task] Brevo Admin Alert Email API Response (HTTP ${adminRes.status}):`, adminResText);

    // 14. Error handling & logging for Brevo responses: enforce both emails succeed
    if (!welcomeRes.ok || !adminRes.ok) {
      const failures: string[] = [];

      if (!welcomeRes.ok) {
        console.error(`[super-task] Brevo Welcome Email failed with HTTP ${welcomeRes.status}:`, welcomeResText);
        failures.push(`Welcome email dispatch failed (${welcomeRes.status}): ${welcomeResText}`);
      }

      if (!adminRes.ok) {
        console.error(`[super-task] Brevo Admin Alert Email failed with HTTP ${adminRes.status}:`, adminResText);
        failures.push(`Admin alert email dispatch failed (${adminRes.status}): ${adminResText}`);
      }

      return jsonResponse(
        {
          success: false,
          error: `Brevo email automation failure: ${failures.join('; ')}`,
          details: {
            welcomeStatus: welcomeRes.status,
            welcomeError: !welcomeRes.ok ? welcomeResText : null,
            adminStatus: adminRes.status,
            adminError: !adminRes.ok ? adminResText : null,
          },
        },
        500
      );
    }

    console.log(`[super-task] Both Brevo emails successfully delivered for ${normalizedEmail}.`);

    // 15. Return JSON success response ONLY after both emails are sent successfully
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
    console.error('[super-task] Unhandled error in Edge Function:', (error as Error).message);
    return jsonResponse(
      { success: false, error: 'Something went wrong. Please try again.' },
      500
    );
  }
});

// Supabase Edge Function: super-task
// Runtime: Deno + TypeScript
//
// Responsibilities:
// 1. Handle CORS Preflight & enforce POST method
// 2. Validate payload (fullName and email)
// 3. Prevent duplicates in PostgreSQL (public.waitlist)
// 4. Save subscriber into PostgreSQL via Supabase Service Role client
// 5. Brevo Email Automation (Referenced from Velour Salon):
//    - Welcome email to subscriber with rich branded HTML, referral invite link & personal role
//    - Admin signup notification alert to gracegrid4@gmail.com with live cohort progress & direct replyTo
//    - Resilient dual-endpoint delivery (api.brevo.com with fallback to api.sendinblue.com)
//    - Direct HTML email content (no dependency on fragile remote Brevo template configurations)
//    - Optional Brevo templateId support with automatic HTML fallback
//    - Contact list sync if BREVO_LIST_ID is configured
// 6. Return standard JSON responses (200 success, 409 duplicate, 400 validation, 500 error)

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LAUNCH_TARGET = 50;
const DEFAULT_ADMIN_EMAIL = 'gracegrid4@gmail.com';

interface WaitlistPayload {
  fullName?: string;
  full_name?: string;
  email?: string;
  role?: string;
  website?: string;
  bot_field?: string;
}

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// In-memory IP rate limiter: max 10 submissions per 60s per client IP
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  if (!ip || ip === 'unknown') return true;
  const now = Date.now();
  const record = ipRequestCounts.get(ip);
  if (!record || now > record.resetAt) {
    ipRequestCounts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (record.count >= 10) {
    return false;
  }
  record.count += 1;
  return true;
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
  const safeFirstName = escapeHtml(firstName);
  const safeEmail = escapeHtml(normalizedEmail);
  const safeRole = escapeHtml(trimmedRole).toUpperCase();
  const safePhase = escapeHtml(devPhase);
  const safeInviteLink = encodeURI(inviteLink);

  return `<!DOCTYPE html>
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
      <div class="badge">${safePhase}</div>
      <h1 class="title">Welcome to GraceGrid</h1>
    </div>
    <div class="body-content">
      <p>Grace and peace to you, <strong>${safeFirstName}</strong>,</p>
      <p>Thank you for stepping into the early access waitlist for <strong>GraceGrid</strong> — a dedicated digital sanctuary built for prayer, live worship, and biblical fellowship free from secular distractions.</p>
      
      <div class="card-highlight">
        <div class="highlight-item">
          <span class="highlight-label">Community Role:</span>
          <span class="highlight-val">${safeRole}</span>
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

      <p>We are actively preparing this sanctuary. You will receive exclusive project development updates directly to <code>${safeEmail}</code> as we roll out closed beta invites and new scripture rooms.</p>

      <a href="${safeInviteLink}" class="btn">Share Your Fellowship Invite Link</a>

      <p style="font-size: 14px; color: #86efac; text-align: center;">
        Your invite link: <br>
        <span style="color: #fef08a; word-break: break-all;">${safeInviteLink}</span>
      </p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} GraceGrid. Designed for the global body of Christ.</p>
      <p>You received this because you registered at gracegrid.app.</p>
    </div>
  </div>
</body>
</html>`;
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
  const safeFullName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safeRole = escapeHtml(role).toUpperCase();
  const safeRegisteredAt = escapeHtml(registeredAt);
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
          <span class="meta-val">${safeFullName}</span>
        </div>
        <div class="meta-row">
          <span class="meta-lbl">Email:</span>
          <span class="meta-val">${safeEmail}</span>
        </div>
        <div class="meta-row">
          <span class="meta-lbl">Community Role:</span>
          <span class="meta-val" style="color: #fef08a;">${safeRole}</span>
        </div>
        <div class="meta-row">
          <span class="meta-lbl">Timestamp:</span>
          <span class="meta-val">${safeRegisteredAt}</span>
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
      <p>© ${new Date().getFullYear()} GraceGrid Sanctuary Sentinel</p>
      <p>Protected by Supabase PostgreSQL & Row-Level Security</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Resilient Brevo Email Sender with primary & backup endpoints
 * Referenced from Velour Salon email automation architecture.
 */
async function sendBrevoEmail({
  apiKey,
  senderName,
  senderEmail,
  to,
  subject,
  htmlContent,
  textContent,
  replyTo,
  templateId,
  params,
}: {
  apiKey: string;
  senderName: string;
  senderEmail: string;
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: { email: string; name?: string };
  templateId?: number | null;
  params?: Record<string, unknown>;
}): Promise<{ success: boolean; status: number; messageId?: string; error?: string }> {
  const headers = {
    'accept': 'application/json',
    'api-key': apiKey.trim(),
    'content-type': 'application/json',
  };

  const primaryUrl = 'https://api.brevo.com/v3/smtp/email';
  const backupUrl = 'https://api.sendinblue.com/v3/smtp/email';

  // 1. If templateId is explicitly configured, attempt template dispatch first
  if (templateId && templateId > 0) {
    try {
      const templatePayload: Record<string, unknown> = {
        templateId,
        sender: { name: senderName, email: senderEmail },
        to,
        params: params || {},
      };
      if (replyTo) templatePayload.replyTo = replyTo;

      const res = await fetch(primaryUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(templatePayload),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: true, status: res.status, messageId: data.messageId };
      }

      const errText = await res.text();
      console.warn(`[super-task] Brevo template ${templateId} dispatch failed (${res.status}): ${errText}. Falling back to direct HTML...`);
    } catch (err) {
      console.warn(`[super-task] Template dispatch exception: ${(err as Error).message}. Falling back to direct HTML...`);
    }
  }

  // 2. Direct HTML Payload (Guaranteed delivery, no remote template dependencies)
  const directPayload: Record<string, unknown> = {
    sender: { name: senderName, email: senderEmail },
    to,
    subject,
    htmlContent,
  };
  if (textContent) directPayload.textContent = textContent;
  if (replyTo) directPayload.replyTo = replyTo;

  // Try primary endpoint (api.brevo.com)
  try {
    const res = await fetch(primaryUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(directPayload),
    });

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return { success: true, status: res.status, messageId: data.messageId };
    }

    const errText = await res.text();
    console.warn(`[super-task] Primary Brevo endpoint returned HTTP ${res.status}: ${errText}. Retrying backup endpoint...`);
  } catch (err) {
    console.warn(`[super-task] Primary Brevo network failure: ${(err as Error).message}. Retrying backup endpoint...`);
  }

  // Fallback endpoint (api.sendinblue.com) like in Velour Salon
  try {
    const backupRes = await fetch(backupUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(directPayload),
    });

    if (backupRes.ok) {
      const data = await backupRes.json().catch(() => ({}));
      return { success: true, status: backupRes.status, messageId: data.messageId };
    }

    const backupErr = await backupRes.text();
    console.error(`[super-task] Backup Brevo endpoint failed (${backupRes.status}): ${backupErr}`);
    return { success: false, status: backupRes.status, error: backupErr };
  } catch (backupErr) {
    console.error(`[super-task] Backup Brevo network failure: ${(backupErr as Error).message}`);
    return { success: false, status: 500, error: (backupErr as Error).message };
  }
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
    // 3. Client IP Rate Limiting (max 10 requests per minute)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                     req.headers.get('cf-connecting-ip') ||
                     req.headers.get('x-real-ip') ||
                     'unknown';

    if (!checkRateLimit(clientIp)) {
      return jsonResponse(
        { success: false, error: 'Too many requests. Please wait a minute and try again.' },
        429
      );
    }

    // 4. Parse JSON request body safely
    let payload: WaitlistPayload;
    try {
      payload = await req.json();
    } catch {
      return jsonResponse(
        { success: false, error: 'Invalid JSON request body.' },
        400
      );
    }

    // 5. Bot Honeypot Trap (silently acknowledge without DB insert or sending emails)
    if (payload.website || payload.bot_field) {
      return jsonResponse({
        success: true,
        message: 'Registration received.',
        subscriber: { id: 'filtered', email: '', role: 'believer', position: LAUNCH_TARGET },
      });
    }

    const rawFullName = payload.fullName ?? payload.full_name ?? '';
    const rawEmail = payload.email ?? '';
    const rawRole = payload.role ?? 'believer';

    const trimmedFullName = String(rawFullName).trim();
    const normalizedEmail = String(rawEmail).trim().toLowerCase();
    const rawRoleStr = String(rawRole).trim().toLowerCase();

    // Whitelist role
    const VALID_ROLES = ['believer', 'pastor', 'leader', 'group', 'student', 'fellowship'];
    const trimmedRole = VALID_ROLES.includes(rawRoleStr) ? rawRoleStr : 'believer';

    // 6. Validate payload inputs (HTTP 400 for invalid payloads)
    if (!trimmedFullName || trimmedFullName.length < 2 || trimmedFullName.length > 100) {
      return jsonResponse(
        { success: false, error: 'Full name must be between 2 and 100 characters.' },
        400
      );
    }

    if (!normalizedEmail || normalizedEmail.length > 255 || !EMAIL_REGEX.test(normalizedEmail)) {
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
    const brevoListIdStr = Deno.env.get('BREVO_LIST_ID');

    // Admin & Verified Sender Configuration
    const adminAlertEmail =
      Deno.env.get('ADMIN_ALERT_EMAIL') ||
      Deno.env.get('ADMIN_EMAIL') ||
      DEFAULT_ADMIN_EMAIL;

    const brevoSenderEmail =
      Deno.env.get('BREVO_SENDER_EMAIL') ||
      adminAlertEmail ||
      DEFAULT_ADMIN_EMAIL;

    const brevoSenderName = Deno.env.get('BREVO_SENDER_NAME') || 'GraceGrid Sanctuary';

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

    // 10. Brevo Contact List Sync (Optional, non-blocking)
    if (brevoApiKey && brevoListIdStr) {
      try {
        const listId = Number(brevoListIdStr);
        if (!isNaN(listId) && listId > 0) {
          const firstName = trimmedFullName.split(/\s+/)[0] || trimmedFullName;
          await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
              'accept': 'application/json',
              'api-key': brevoApiKey.trim(),
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              email: normalizedEmail,
              attributes: {
                FIRSTNAME: firstName,
                FULLNAME: trimmedFullName,
                ROLE: trimmedRole,
                WAITLIST_STAGE: 'ACTIVE',
              },
              listIds: [listId],
              updateEnabled: true,
            }),
          }).catch((err) => console.warn('[super-task] Brevo contact sync warning:', err));
        }
      } catch (_) {}
    }

    // 11. Validate Brevo Secrets before attempting to send emails
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

    const parsedTemplateId = brevoTemplateIdRaw ? Number(brevoTemplateIdRaw) : null;
    const templateId = parsedTemplateId && !isNaN(parsedTemplateId) && parsedTemplateId > 0 ? parsedTemplateId : null;

    // 12. Email Content Generation
    const firstName = trimmedFullName.split(/\s+/)[0] || trimmedFullName;
    const inviteCode = trimmedFullName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'fellowship';
    const inviteLink = `https://gracegrid.app/?ref=${encodeURIComponent(inviteCode)}`;
    const devPhase = 'Phase 1: Pre-Launch Sanctuary';
    const registeredTimestamp = insertedData.created_at || new Date().toISOString();

    const welcomeHtml = generateWelcomeEmailHtml({
      firstName,
      trimmedFullName,
      normalizedEmail,
      trimmedRole,
      devPhase,
      inviteLink,
    });

    const welcomeText = `Grace and peace to you, ${firstName}!

Thank you for joining the early access waitlist for GraceGrid — a digital sanctuary for worship and fellowship.

Community Role: ${trimmedRole.toUpperCase()}
Status: CONFIRMED
Cohort Target: First 50 Believers

Your personal fellowship invite link:
${inviteLink}

We will keep you updated as we rollout closed beta invites.
© ${new Date().getFullYear()} GraceGrid. Designed for the global body of Christ.`;

    const adminHtml = generateAdminAlertEmailHtml({
      fullName: trimmedFullName,
      email: normalizedEmail,
      role: trimmedRole,
      totalCount,
      registeredAt: new Date(registeredTimestamp).toUTCString(),
    });

    const adminText = `New GraceGrid Waitlist Signup:
Full Name: ${trimmedFullName}
Email: ${normalizedEmail}
Role: ${trimmedRole.toUpperCase()}
Registered At: ${new Date(registeredTimestamp).toUTCString()}
Total Subscribers: ${totalCount} / ${LAUNCH_TARGET}

Open Admin Dashboard: https://gracegrid.app/gracegrid-admin/dashboard`;

    const welcomeParams = {
      firstName,
      FIRSTNAME: firstName,
      fullName: trimmedFullName,
      FULLNAME: trimmedFullName,
      email: normalizedEmail,
      role: trimmedRole,
      inviteLink,
      devPhase,
      year: new Date().getFullYear(),
    };

    console.log(`[super-task] Dispatching Brevo Welcome Email (To: ${normalizedEmail}) and Admin Alert Email (To: ${adminAlertEmail})...`);

    // 13. Dispatch BOTH emails concurrently via resilient Brevo helper
    const [welcomeRes, adminRes] = await Promise.allSettled([
      sendBrevoEmail({
        apiKey: brevoApiKey,
        senderName: brevoSenderName,
        senderEmail: brevoSenderEmail,
        to: [{ email: normalizedEmail, name: trimmedFullName }],
        subject: '🕊️ Welcome to GraceGrid — Your Early Access Confirmation',
        htmlContent: welcomeHtml,
        textContent: welcomeText,
        replyTo: { email: adminAlertEmail, name: 'GraceGrid Sanctuary' },
        templateId,
        params: welcomeParams,
      }),
      sendBrevoEmail({
        apiKey: brevoApiKey,
        senderName: brevoSenderName,
        senderEmail: brevoSenderEmail,
        to: [{ email: adminAlertEmail, name: 'GraceGrid Admin' }],
        subject: `🔔 New GraceGrid Waitlist Signup: ${trimmedFullName} (${trimmedRole.toUpperCase()})`,
        htmlContent: adminHtml,
        textContent: adminText,
        replyTo: { email: normalizedEmail, name: trimmedFullName },
      }),
    ]);

    const welcomeResult = welcomeRes.status === 'fulfilled' ? welcomeRes.value : { success: false, status: 500, error: welcomeRes.reason?.message };
    const adminResult = adminRes.status === 'fulfilled' ? adminRes.value : { success: false, status: 500, error: adminRes.reason?.message };

    console.log(`[super-task] Brevo Welcome Email result:`, welcomeResult);
    console.log(`[super-task] Brevo Admin Alert Email result:`, adminResult);

    // 14. Error handling: check if both failed completely
    if (!welcomeResult.success && !adminResult.success) {
      console.error('[super-task] Both Brevo emails failed to dispatch.');
      return jsonResponse(
        {
          success: false,
          error: `Brevo email automation failure: ${welcomeResult.error || 'Welcome email failed'}; ${adminResult.error || 'Admin alert failed'}`,
          details: {
            welcomeStatus: welcomeResult.status,
            welcomeError: welcomeResult.error,
            adminStatus: adminResult.status,
            adminError: adminResult.error,
          },
        },
        500
      );
    }

    console.log(`[super-task] Brevo email automation finished for ${normalizedEmail}. (Welcome: ${welcomeResult.success}, Admin: ${adminResult.success})`);

    // 15. Return JSON success response
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
          emailsDelivered: {
            welcome: welcomeResult.success,
            admin: adminResult.success,
          },
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

// Supabase Edge Function: send-phase-update
// Runtime: Deno + TypeScript
// Responsibilities:
// 1. Authenticate administrative request via ADMIN_API_KEY or SUPABASE_SERVICE_ROLE_KEY
// 2. Fetch waitlist subscribers from PostgreSQL (with optional role filtering)
// 3. Dispatch development phase updates via Brevo API
// 4. Update subscriber attributes (DEV_PHASE) in Brevo
// 5. Support test email preview before full broadcast

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PhaseUpdatePayload {
  phaseName: string;          // e.g. "Phase 2: Closed Alpha & Scripture Feed"
  subject: string;            // e.g. "🕊️ GraceGrid Update: We've reached Phase 2!"
  headline?: string;          // e.g. "Alpha Testing Is Live for Early Believers"
  message?: string;           // Main progress explanation
  highlights?: string[];      // Bullet points of accomplishments
  ctaText?: string;           // e.g. "View Development Progress"
  ctaUrl?: string;            // e.g. "https://gracegrid.app/#community-progress"
  filterRole?: string;        // 'all' | 'believer' | 'leader' | 'group' | 'student'
  testEmail?: string;         // If specified, only sends a single preview email
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

function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generatePhaseUpdateHtml({
  recipientName,
  phaseName,
  headline,
  message,
  highlights,
  ctaText,
  ctaUrl,
}: {
  recipientName: string;
  phaseName: string;
  headline: string;
  message: string;
  highlights: string[];
  ctaText: string;
  ctaUrl: string;
}): string {
  const safeRecipientName = escapeHtml(recipientName);
  const safePhaseName = escapeHtml(phaseName);
  const safeHeadline = escapeHtml(headline);
  const safeMessage = escapeHtml(message);
  const safeCtaText = escapeHtml(ctaText);
  const safeCtaUrl = encodeURI(ctaUrl);

  const highlightsHtml = highlights && highlights.length > 0
    ? `
      <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(22, 163, 74, 0.3); border-radius: 12px; padding: 20px; margin: 24px 0;">
        <h3 style="margin: 0 0 12px; font-size: 15px; color: #86efac; text-transform: uppercase; letter-spacing: 0.5px;">Phase Accomplishments</h3>
        <ul style="margin: 0; padding-left: 20px; color: #f0fdf4;">
          ${highlights.map((h) => `<li style="margin-bottom: 8px;">${escapeHtml(h)}</li>`).join('')}
        </ul>
      </div>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GraceGrid Development Update</title>
  <style>
    body { margin: 0; padding: 0; background-color: #021e10; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f0fdf4; }
    .wrapper { max-width: 600px; margin: 40px auto; background-color: #062c19; border: 1px solid #16a34a33; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    .header { padding: 40px 32px 20px; text-align: center; background: radial-gradient(circle at top, rgba(34, 197, 94, 0.2), transparent 70%); }
    .cross { font-size: 36px; margin-bottom: 12px; }
    .badge { display: inline-block; padding: 4px 14px; background: rgba(212, 175, 55, 0.15); border: 1px solid #d4af37; border-radius: 999px; color: #fef08a; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
    .title { font-size: 24px; font-weight: 700; color: #ffffff; margin: 12px 0 0; }
    .body-content { padding: 32px; font-size: 16px; line-height: 1.65; color: #dcfce7; }
    .btn { display: block; text-align: center; background: linear-gradient(135deg, #16a34a, #15803d); color: #ffffff !important; text-decoration: none; padding: 16px 28px; border-radius: 10px; font-weight: 700; font-size: 16px; margin: 30px 0 20px; box-shadow: 0 8px 20px rgba(22, 163, 74, 0.3); }
    .footer { padding: 24px 32px; background-color: #021a0d; text-align: center; font-size: 13px; color: #4ade8099; border-top: 1px solid rgba(22, 163, 74, 0.2); }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="cross">🕊️</div>
      <div class="badge">${safePhaseName}</div>
      <h1 class="title">${safeHeadline}</h1>
    </div>
    <div class="body-content">
      <p>Grace and peace to you, <strong>${safeRecipientName}</strong>,</p>
      <p>${safeMessage}</p>
      
      ${highlightsHtml}

      <a href="${safeCtaUrl}" class="btn">${safeCtaText}</a>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} GraceGrid. Building a sacred digital sanctuary for the body of Christ.</p>
      <p>You received this project development update because you joined the GraceGrid early access waitlist.</p>
    </div>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ success: false, error: 'Method not allowed. Use POST.' }, 405);
  }

  try {
    // 1. Verify Administrative Authorization
    const adminKey = Deno.env.get('ADMIN_API_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const providedKey = req.headers.get('x-admin-key') || req.headers.get('authorization')?.replace('Bearer ', '');

    if (!adminKey || !providedKey || providedKey !== adminKey) {
      return jsonResponse({ success: false, error: 'Unauthorized. Valid x-admin-key or service_role authorization header required.' }, 401);
    }

    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      return jsonResponse({ success: false, error: 'BREVO_API_KEY environment variable is not configured.' }, 500);
    }

    const brevoSenderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || Deno.env.get('ADMIN_ALERT_EMAIL') || Deno.env.get('ADMIN_EMAIL') || 'gracegrid4@gmail.com';
    const brevoSenderName = Deno.env.get('BREVO_SENDER_NAME') || 'GraceGrid Sanctuary Updates';

    // 2. Parse Request Payload
    const payload: PhaseUpdatePayload = await req.json();
    const phaseName = payload.phaseName || 'Project Development Update';
    const subject = payload.subject || `🕊️ GraceGrid Update: ${phaseName}`;
    const headline = payload.headline || `GraceGrid Development: ${phaseName}`;
    const message = payload.message || 'We are excited to share the latest progress on the GraceGrid sanctuary platform development with our waitlist community.';
    const highlights = payload.highlights || [];
    const ctaText = payload.ctaText || 'View Community Progress';
    const ctaUrl = payload.ctaUrl || 'https://gracegrid.app/#community-progress';
    const filterRole = payload.filterRole || 'all';
    const testEmail = payload.testEmail ? String(payload.testEmail).trim().toLowerCase() : null;

    // 3. If Test Email is provided, only send one test email
    if (testEmail) {
      const htmlContent = generatePhaseUpdateHtml({
        recipientName: 'Fellow Believer (Test Preview)',
        phaseName,
        headline,
        message,
        highlights,
        ctaText,
        ctaUrl,
      });

      const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: brevoSenderName, email: brevoSenderEmail },
          to: [{ email: testEmail, name: 'Admin Preview' }],
          subject: `[TEST PREVIEW] ${subject}`,
          htmlContent,
        }),
      });

      if (!brevoRes.ok) {
        const errText = await brevoRes.text();
        return jsonResponse({ success: false, error: `Brevo test email failed: ${errText}` }, 500);
      }

      return jsonResponse({
        success: true,
        mode: 'test_preview',
        message: `Test development phase update successfully delivered to ${testEmail}`,
        phaseName,
      });
    }

    // 4. Fetch all targeted subscribers from Supabase PostgreSQL
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return jsonResponse({ success: false, error: 'Database service configuration missing.' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let query = supabase.from('waitlist').select('id, full_name, email, role');

    if (filterRole && filterRole !== 'all') {
      query = query.eq('role', filterRole);
    }

    const { data: subscribers, error: dbError } = await query;

    if (dbError) {
      return jsonResponse({ success: false, error: `Database error: ${dbError.message}` }, 500);
    }

    if (!subscribers || subscribers.length === 0) {
      return jsonResponse({ success: true, message: 'No subscribers found matching the target criteria.', totalSent: 0 });
    }

    // 5. Send Broadcast via Brevo (Batched)
    let totalSent = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      const rawName = subscriber.full_name || 'Believer';
      const firstName = rawName.split(/\s+/)[0] || rawName;
      const htmlContent = generatePhaseUpdateHtml({
        recipientName: firstName,
        phaseName,
        headline,
        message,
        highlights,
        ctaText,
        ctaUrl,
      });

      try {
        const sendRes = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            sender: { name: brevoSenderName, email: brevoSenderEmail },
            to: [{ email: subscriber.email, name: rawName }],
            subject,
            htmlContent,
          }),
        });

        if (sendRes.ok) {
          totalSent++;
        } else {
          failedCount++;
          console.warn(`[send-phase-update] Failed sending to ${subscriber.email}:`, await sendRes.text());
        }
      } catch (err) {
        failedCount++;
        console.error(`[send-phase-update] Error sending to ${subscriber.email}:`, (err as Error).message);
      }
    }

    return jsonResponse({
      success: true,
      message: `Successfully broadcast phase update for '${phaseName}' via Brevo.`,
      stats: {
        phaseName,
        totalTargeted: subscribers.length,
        totalSent,
        failedCount,
      },
    }, 200);

  } catch (error) {
    console.error('[send-phase-update] Unhandled error:', (error as Error).message);
    return jsonResponse({ success: false, error: 'Internal Server Error' }, 500);
  }
});

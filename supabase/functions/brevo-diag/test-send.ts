import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req: Request) => {
  // Enforce administrative authorization
  const adminKey = Deno.env.get('ADMIN_API_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const providedKey = req.headers.get('x-admin-key') || req.headers.get('authorization')?.replace('Bearer ', '');

  if (!adminKey || !providedKey || providedKey !== adminKey) {
    return new Response(JSON.stringify({ success: false, error: 'Unauthorized. Admin authorization required.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const brevoApiKey = Deno.env.get('BREVO_API_KEY') || '';
  
  const payload = {
    sender: {
      name: "GraceGrid Sanctuary",
      email: "danielelijah1197@gmail.com"
    },
    to: [
      {
        email: "gracegrid4@gmail.com",
        name: "GraceGrid Admin"
      }
    ],
    replyTo: {
      email: "gracegrid4@gmail.com",
      name: "GraceGrid Admin"
    },
    subject: "🕊️ GraceGrid Sanctuary - Live Verification Test",
    htmlContent: "<div style='font-family:sans-serif;padding:20px;background:#062c19;color:#fff;'><h2>🕊️ GraceGrid Live Test</h2><p>This is a live email test sent to gracegrid4@gmail.com using verified sender danielelijah1197@gmail.com!</p></div>"
  };

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': brevoApiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const status = res.status;
  const body = await res.text();

  return new Response(JSON.stringify({ status, body }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

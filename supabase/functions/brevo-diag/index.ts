import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req: Request) => {
  const brevoApiKey = Deno.env.get('BREVO_API_KEY') || '';

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': brevoApiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'GraceGrid Sanctuary', email: 'gracegrid4@gmail.com' },
      to: [{ email: 'gracegrid4@gmail.com', name: 'GraceGrid Admin' }],
      replyTo: { email: 'gracegrid4@gmail.com', name: 'GraceGrid Admin' },
      subject: '🕊️ GraceGrid Sanctuary - Verified Sender Test',
      htmlContent: '<div style="font-family:sans-serif;padding:24px;background:#062c19;color:#f0fdf4;border-radius:12px;"><h2>🕊️ GraceGrid Live Test from gracegrid4@gmail.com</h2><p>This email was sent directly from <strong>gracegrid4@gmail.com</strong>!</p></div>',
    }),
  });

  const status = res.status;
  const body = await res.text();

  return new Response(JSON.stringify({ status, body }, null, 2), {
    headers: { 'Content-Type': 'application/json' },
  });
});

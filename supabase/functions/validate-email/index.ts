// Validate email by checking format, disposable domains, and DNS MX records.
// No external API key required — uses Cloudflare's free DNS-over-HTTPS.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'tempmail.com',
  'throwawaymail.com', 'trashmail.com', 'yopmail.com', 'getairmail.com',
  'sharklasers.com', 'temp-mail.org', 'fakeinbox.com', 'maildrop.cc',
  'mintemail.com', 'mohmal.com', 'dispostable.com', 'tempr.email',
  'mailnesia.com', 'spam4.me', 'getnada.com', 'inboxbear.com',
  'tempmailo.com', 'tmpmail.org', 'emailondeck.com', 'mytemp.email',
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function hasMxRecord(domain: string): Promise<boolean> {
  try {
    // Cloudflare DNS-over-HTTPS (free, no key)
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=MX`,
      { headers: { Accept: 'application/dns-json' } }
    );
    if (!res.ok) return false;
    const data = await res.json();
    if (Array.isArray(data.Answer) && data.Answer.length > 0) return true;
    // Fallback: check A record (some domains accept mail without MX)
    const aRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A`,
      { headers: { Accept: 'application/dns-json' } }
    );
    if (!aRes.ok) return false;
    const aData = await aRes.json();
    return Array.isArray(aData.Answer) && aData.Answer.length > 0;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ valid: false, reason: 'Email is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      return new Response(JSON.stringify({ valid: false, reason: 'Invalid email format' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const domain = trimmed.split('@')[1];
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return new Response(JSON.stringify({ valid: false, reason: 'Disposable email addresses are not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const mxOk = await hasMxRecord(domain);
    if (!mxOk) {
      return new Response(JSON.stringify({
        valid: false,
        reason: 'This email domain does not appear to exist or cannot receive mail',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ valid: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ valid: false, reason: 'Validation failed', error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

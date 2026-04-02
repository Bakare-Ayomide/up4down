import { corsHeaders } from '@supabase/supabase-js/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, body, smtp_config } = await req.json()

    if (!to || !subject || !smtp_config?.host) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use Deno's built-in SMTP via denodrivers/smtp
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts")

    const client = new SMTPClient({
      connection: {
        hostname: smtp_config.host,
        port: smtp_config.port || 587,
        tls: smtp_config.encryption === 'ssl',
        auth: {
          username: smtp_config.username,
          password: smtp_config.password,
        },
      },
    })

    await client.send({
      from: `${smtp_config.from_name || 'Zerolord'} <${smtp_config.from_email || smtp_config.username}>`,
      to,
      subject,
      content: body,
      html: body.includes('<') ? body : undefined,
    })

    await client.close()

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

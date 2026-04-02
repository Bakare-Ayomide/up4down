import { corsHeaders } from '@supabase/supabase-js/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imap_config } = await req.json()

    if (!imap_config?.host) {
      return new Response(JSON.stringify({ error: 'IMAP not configured' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use Deno's TCP to connect to IMAP - simplified fetch of recent emails
    // Note: Full IMAP is complex. This provides basic functionality.
    const conn = await Deno.connectTls({
      hostname: imap_config.host,
      port: imap_config.port || 993,
    })

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const sendCommand = async (cmd: string): Promise<string> => {
      await conn.write(encoder.encode(cmd + "\r\n"))
      const buf = new Uint8Array(8192)
      const n = await conn.read(buf)
      return decoder.decode(buf.subarray(0, n || 0))
    }

    // Read greeting
    const greetBuf = new Uint8Array(4096)
    await conn.read(greetBuf)

    // Login
    const loginResp = await sendCommand(`a1 LOGIN "${imap_config.username}" "${imap_config.password}"`)
    if (!loginResp.includes("OK")) {
      conn.close()
      return new Response(JSON.stringify({ error: 'IMAP login failed', emails: [] }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Select INBOX
    await sendCommand("a2 SELECT INBOX")

    // Fetch last 20 message headers
    const fetchResp = await sendCommand("a3 FETCH 1:20 (BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])")

    // Parse basic email info from response
    const emails: any[] = []
    const lines = fetchResp.split("\r\n")
    let current: any = {}
    for (const line of lines) {
      if (line.toLowerCase().startsWith("from:")) {
        current.from = line.substring(5).trim()
      } else if (line.toLowerCase().startsWith("subject:")) {
        current.subject = line.substring(8).trim()
      } else if (line.toLowerCase().startsWith("date:")) {
        current.date = line.substring(5).trim()
        current.id = `msg-${emails.length}`
        current.preview = ""
        emails.push(current)
        current = {}
      }
    }

    // Logout
    await sendCommand("a4 LOGOUT")
    conn.close()

    return new Response(JSON.stringify({ emails: emails.reverse() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message, emails: [] }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { subject, content, contentType } = await req.json();
    if (!subject || !content) {
      return new Response(JSON.stringify({ error: "subject and content required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get SMTP config from site_settings
    const { data: smtpRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "email_config")
      .single();

    if (!smtpRow?.value) {
      return new Response(JSON.stringify({ error: "SMTP not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const smtp = smtpRow.value as any;
    if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass) {
      return new Response(JSON.stringify({ error: "SMTP credentials incomplete" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all waitlist emails
    const { data: subscribers } = await supabase
      .from("waitlist_emails")
      .select("email");

    if (!subscribers || subscribers.length === 0) {
      return new Response(JSON.stringify({ error: "No subscribers found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send emails via SMTP using denomailer
    const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");

    const client = new SMTPClient({
      connection: {
        hostname: smtp.smtp_host,
        port: parseInt(smtp.smtp_port || "587"),
        tls: smtp.smtp_port === "465",
        auth: {
          username: smtp.smtp_user,
          password: smtp.smtp_pass,
        },
      },
    });

    let sentCount = 0;
    const fromEmail = smtp.smtp_from || smtp.smtp_user;

    for (const sub of subscribers) {
      try {
        await client.send({
          from: fromEmail,
          to: sub.email,
          subject,
          content: contentType === "plain" ? content : undefined,
          html: contentType === "html" ? content : undefined,
        });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send to ${sub.email}:`, err);
      }
    }

    await client.close();

    return new Response(JSON.stringify({ success: true, sent: sentCount, total: subscribers.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Newsletter error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

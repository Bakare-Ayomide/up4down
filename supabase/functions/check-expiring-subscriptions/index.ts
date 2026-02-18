import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "chrisbak.music@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Auto-downgrade expired subscriptions
    await supabase.rpc("auto_downgrade_expired_subscriptions");

    // 2. Find subscriptions expiring today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const { data: expiring } = await supabase
      .from("subscriptions")
      .select("*, profiles!inner(email, display_name)")
      .eq("status", "active")
      .gte("expires_at", startOfDay)
      .lt("expires_at", endOfDay);

    // 3. Send email notification to admin if there are expiring subs
    if (expiring && expiring.length > 0) {
      const userList = expiring.map((sub: any) => {
        const email = sub.profiles?.email || "Unknown";
        const name = sub.profiles?.display_name || email;
        return `- ${name} (${email}) - Expires: ${new Date(sub.expires_at).toLocaleDateString()}`;
      }).join("\n");

      const emailBody = `
Hello Admin,

The following premium subscriptions are expiring today:

${userList}

Total: ${expiring.length} subscription(s)

These accounts will be automatically downgraded to free tier.

-- Up4Down System
      `.trim();

      // Use Lovable AI gateway to format a nice notification (optional)
      // For now, we'll use a simple fetch to a free email service
      // Since we can't use external SMTP without keys, we'll store the notification
      // in site_settings for the admin to see in the dashboard

      await supabase.from("site_settings").upsert({
        key: "expiry_notifications",
        value: {
          last_checked: new Date().toISOString(),
          expiring_today: expiring.length,
          details: userList,
          email_body: emailBody,
        },
      }, { onConflict: "key" });

      // Try to send via Resend if key exists
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Up4Down <onboarding@resend.dev>",
            to: [ADMIN_EMAIL],
            subject: `⚠️ ${expiring.length} Premium Subscription(s) Expiring Today`,
            text: emailBody,
          }),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiring?.length || 0,
        message: `Checked subscriptions. ${expiring?.length || 0} expiring today.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

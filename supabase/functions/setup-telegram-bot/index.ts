import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!TELEGRAM_BOT_TOKEN) {
      return new Response(
        JSON.stringify({ 
          error: "TELEGRAM_BOT_TOKEN is not configured",
          setup_required: true 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    if (!SUPABASE_URL) {
      throw new Error("SUPABASE_URL is not configured");
    }

    // Extract project ref from Supabase URL
    const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
    const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/telegram-webhook`;

    // Set webhook
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ["message", "channel_post"],
        }),
      }
    );

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.description || "Failed to set webhook");
    }

    // Get bot info
    const botInfoRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
    );
    const botInfo = await botInfoRes.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Telegram bot webhook configured successfully!",
        webhook_url: webhookUrl,
        bot_username: botInfo.result?.username,
        instructions: `
1. Add @${botInfo.result?.username} to your Telegram channel as an admin
2. Forward any file to the channel - it will be auto-uploaded
3. Use the first line of caption as the title, rest as description
        `.trim(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Setup error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
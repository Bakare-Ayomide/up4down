import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get IndexNow settings
    const { data: settings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "indexnow_settings")
      .single();

    if (!settings?.value?.enabled || !settings?.value?.api_key) {
      return new Response(JSON.stringify({ error: "IndexNow disabled" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = settings.value.api_key;
    const host = new URL(url).host;

    // Ping IndexNow
    const pingUrl = `https://api.indexnow.org/indexnow?url=${encodeURIComponent(url)}&key=${apiKey}`;
    const res = await fetch(pingUrl);

    return new Response(JSON.stringify({ success: res.ok, status: res.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

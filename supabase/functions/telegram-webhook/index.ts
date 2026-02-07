import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    title?: string;
    type: string;
  };
  text?: string;
  document?: {
    file_id: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
  };
  photo?: Array<{
    file_id: string;
    file_size?: number;
    width: number;
    height: number;
  }>;
  caption?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!TELEGRAM_BOT_TOKEN) {
      throw new Error("TELEGRAM_BOT_TOKEN is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse the Telegram update
    const update: TelegramUpdate = await req.json();
    const message = update.message || update.channel_post;

    if (!message) {
      return new Response(JSON.stringify({ ok: true, message: "No message to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if there's a document (file) in the message
    if (message.document) {
      const doc = message.document;
      
      // Get file info from Telegram
      const fileInfoRes = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${doc.file_id}`
      );
      const fileInfo = await fileInfoRes.json();
      
      if (!fileInfo.ok) {
        throw new Error("Failed to get file info from Telegram");
      }

      const filePath = fileInfo.result.file_path;
      const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
      
      // Download the file
      const fileRes = await fetch(fileUrl);
      const fileBlob = await fileRes.blob();
      
      // Upload to Supabase storage
      const fileName = `telegram-${Date.now()}-${doc.file_name || "file"}`;
      const { error: uploadError } = await supabase.storage
        .from("downloads")
        .upload(fileName, fileBlob, {
          contentType: doc.mime_type || "application/octet-stream",
        });

      if (uploadError) {
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("downloads")
        .getPublicUrl(fileName);

      // Parse caption for metadata
      const caption = message.caption || message.text || "";
      const lines = caption.split("\n").filter(Boolean);
      const title = lines[0] || doc.file_name || "Untitled";
      const description = lines.slice(1).join("\n") || "";
      
      // Get file extension
      const fileType = doc.file_name?.split(".").pop()?.toLowerCase() || "file";
      
      // Format file size
      let fileSize = "";
      if (doc.file_size) {
        const sizeMB = doc.file_size / (1024 * 1024);
        fileSize = sizeMB >= 1 
          ? `${sizeMB.toFixed(2)} MB` 
          : `${(doc.file_size / 1024).toFixed(2)} KB`;
      }

      // Create download item
      const { data: newItem, error: insertError } = await supabase
        .from("download_items")
        .insert({
          title,
          description,
          download_url: publicUrl,
          file_type: fileType,
          file_size: fileSize,
          thumbnail_url: JSON.stringify([]),
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to create download item: ${insertError.message}`);
      }

      // Send confirmation to Telegram
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: message.chat.id,
          text: `✅ File uploaded successfully!\n\n📄 Title: ${title}\n📦 Size: ${fileSize}\n🔗 ID: ${newItem.id}`,
          reply_to_message_id: message.message_id,
        }),
      });

      return new Response(JSON.stringify({ ok: true, item_id: newItem.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If no document, just acknowledge
    return new Response(JSON.stringify({ ok: true, message: "No file to process" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Telegram webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
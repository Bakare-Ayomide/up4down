
-- Create table to track connected chats (channels and groups)
CREATE TABLE public.telegram_connected_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID NOT NULL REFERENCES public.telegram_bots(id) ON DELETE CASCADE,
  chat_id BIGINT NOT NULL,
  chat_title TEXT,
  chat_type TEXT NOT NULL DEFAULT 'unknown', -- 'channel', 'group', 'supergroup', 'private'
  is_active BOOLEAN NOT NULL DEFAULT true,
  messages_processed INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(bot_id, chat_id)
);

-- Enable RLS
ALTER TABLE public.telegram_connected_chats ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view connected chats"
ON public.telegram_connected_chats FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert connected chats"
ON public.telegram_connected_chats FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update connected chats"
ON public.telegram_connected_chats FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete connected chats"
ON public.telegram_connected_chats FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role to insert/update (for webhook)
-- Service role bypasses RLS by default, so no extra policy needed

-- Trigger for updated_at
CREATE TRIGGER update_telegram_connected_chats_updated_at
BEFORE UPDATE ON public.telegram_connected_chats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

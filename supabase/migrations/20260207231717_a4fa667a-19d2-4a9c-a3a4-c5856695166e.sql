-- Create table for storing multiple Telegram bot configurations
CREATE TABLE public.telegram_bots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  bot_token TEXT NOT NULL,
  bot_username TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.telegram_bots ENABLE ROW LEVEL SECURITY;

-- Only admins can view bots (tokens are sensitive)
CREATE POLICY "Admins can view telegram bots"
  ON public.telegram_bots
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert bots
CREATE POLICY "Admins can insert telegram bots"
  ON public.telegram_bots
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update bots
CREATE POLICY "Admins can update telegram bots"
  ON public.telegram_bots
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete bots
CREATE POLICY "Admins can delete telegram bots"
  ON public.telegram_bots
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_telegram_bots_updated_at
  BEFORE UPDATE ON public.telegram_bots
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
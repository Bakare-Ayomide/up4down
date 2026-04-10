
CREATE TABLE public.download_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.download_items(id) ON DELETE SET NULL,
  user_id UUID,
  user_email TEXT,
  item_title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.download_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view download logs"
ON public.download_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert download logs"
ON public.download_logs FOR INSERT
WITH CHECK (true);

CREATE INDEX idx_download_logs_created_at ON public.download_logs(created_at DESC);
CREATE INDEX idx_download_logs_item_id ON public.download_logs(item_id);
CREATE INDEX idx_download_logs_user_id ON public.download_logs(user_id);

CREATE TABLE public.newsletter_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  content text NOT NULL,
  content_type text NOT NULL DEFAULT 'html',
  recipient_count integer NOT NULL DEFAULT 0,
  trigger_type text NOT NULL DEFAULT 'manual',
  news_id uuid REFERENCES public.news(id) ON DELETE SET NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage newsletter logs" ON public.newsletter_logs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
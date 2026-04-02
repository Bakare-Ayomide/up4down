
-- Ad snippets table for external ad platform code (Adsterra, etc.)
CREATE TABLE public.ad_snippets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ad_type TEXT NOT NULL DEFAULT 'banner',
  snippet TEXT NOT NULL,
  placement TEXT NOT NULL DEFAULT 'global',
  status TEXT NOT NULL DEFAULT 'active',
  preview_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ad snippets viewable by everyone" ON public.ad_snippets FOR SELECT TO public USING (true);
CREATE POLICY "Admins can insert ad snippets" ON public.ad_snippets FOR INSERT TO public WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update ad snippets" ON public.ad_snippets FOR UPDATE TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete ad snippets" ON public.ad_snippets FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));

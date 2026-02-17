
-- Custom pages table for the admin page builder
CREATE TABLE public.custom_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Custom pages are viewable by everyone" ON public.custom_pages
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert custom pages" ON public.custom_pages
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update custom pages" ON public.custom_pages
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete custom pages" ON public.custom_pages
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_custom_pages_updated_at
  BEFORE UPDATE ON public.custom_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

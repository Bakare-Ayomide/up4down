
-- Announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL DEFAULT '',
  image text,
  link text,
  status text NOT NULL DEFAULT 'inactive',
  display_type text NOT NULL DEFAULT 'banner',
  schedule_time timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Announcements viewable by everyone" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins can insert announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update announcements" ON public.announcements FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete announcements" ON public.announcements FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Waitlist emails table
CREATE TABLE public.waitlist_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  source text DEFAULT 'website',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.waitlist_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join waitlist" ON public.waitlist_emails FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view waitlist" ON public.waitlist_emails FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete waitlist" ON public.waitlist_emails FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- FAQ entries table
CREATE TABLE public.faq_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.faq_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FAQ viewable by everyone" ON public.faq_entries FOR SELECT USING (true);
CREATE POLICY "Admins can insert FAQ" ON public.faq_entries FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update FAQ" ON public.faq_entries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete FAQ" ON public.faq_entries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Media assets table
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  image_url text NOT NULL,
  category text NOT NULL DEFAULT 'screenshot',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Media viewable by everyone" ON public.media_assets FOR SELECT USING (true);
CREATE POLICY "Admins can insert media" ON public.media_assets FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update media" ON public.media_assets FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete media" ON public.media_assets FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Media assets storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('media-assets', 'media-assets', true);
CREATE POLICY "Anyone can view media assets" ON storage.objects FOR SELECT USING (bucket_id = 'media-assets');
CREATE POLICY "Admins can upload media assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media-assets' AND public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete media assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media-assets' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Seed new site_settings keys
INSERT INTO public.site_settings (key, value) VALUES
('app_settings', '{"app_name":"Zerolord","app_description":"Download Apps, Games, Software & More","support_email":"","support_url":"","privacy_policy_url":"","terms_of_service_url":"","website_url":""}'),
('seo_settings', '{"meta_title":"Zerolord - Download Apps, Games, Software & More","meta_description":"Download thousands of apps, games, software, videos, and files.","meta_keywords":"download,apps,games,software","og_title":"Zerolord","og_description":"Your ultimate download platform","og_image":"","og_url":"","twitter_card_type":"summary_large_image","twitter_title":"","twitter_description":"","twitter_image":""}'),
('social_links', '{"twitter_url":"","instagram_url":"","facebook_url":"","youtube_url":"","telegram_url":"","discord_url":""}'),
('app_store_settings', '{"app_store_keywords":"","short_description":"","long_description":"","promotional_text":"","app_store_support_url":"","app_store_marketing_url":""}'),
('analytics_settings', '{"google_analytics_id":"","facebook_pixel_id":""}'),
('indexnow_settings', '{"enabled":false,"api_key":""}'),
('robots_settings', '{"indexing_enabled":true,"custom_rules":""}')
ON CONFLICT (key) DO NOTHING;

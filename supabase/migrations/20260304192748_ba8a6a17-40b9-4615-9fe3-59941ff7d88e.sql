
-- Ads table
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_url text,
  media_type text NOT NULL DEFAULT 'image', -- image, video, banner
  ad_url text NOT NULL,
  redirect_url text,
  pages text[] NOT NULL DEFAULT '{}', -- which pages to show on
  position text NOT NULL DEFAULT 'sidebar', -- sidebar, top, bottom, inline
  is_active boolean NOT NULL DEFAULT true,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ad events table for detailed tracking
CREATE TABLE public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid REFERENCES public.ads(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL, -- impression, click
  page text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

-- Ads policies
CREATE POLICY "Ads viewable by everyone" ON public.ads FOR SELECT USING (true);
CREATE POLICY "Admins can insert ads" ON public.ads FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update ads" ON public.ads FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete ads" ON public.ads FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Ad events policies
CREATE POLICY "Anyone can insert ad events" ON public.ad_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view ad events" ON public.ad_events FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to increment ad impressions
CREATE OR REPLACE FUNCTION public.increment_ad_impressions(ad_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE ads SET impressions = impressions + 1 WHERE id = ad_id;
END;
$$;

-- Function to increment ad clicks  
CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE ads SET clicks = clicks + 1 WHERE id = ad_id;
END;
$$;

-- Storage bucket for ad media
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-media', 'ad-media', true);

-- Storage policies for ad-media bucket
CREATE POLICY "Anyone can view ad media" ON storage.objects FOR SELECT USING (bucket_id = 'ad-media');
CREATE POLICY "Admins can upload ad media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ad-media' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update ad media" ON storage.objects FOR UPDATE USING (bucket_id = 'ad-media' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete ad media" ON storage.objects FOR DELETE USING (bucket_id = 'ad-media' AND has_role(auth.uid(), 'admin'::app_role));

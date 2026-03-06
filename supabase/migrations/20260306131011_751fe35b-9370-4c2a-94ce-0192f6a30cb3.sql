
-- Add enhanced tracking columns to ad_events
ALTER TABLE public.ad_events ADD COLUMN IF NOT EXISTS ip_address text;
ALTER TABLE public.ad_events ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.ad_events ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.ad_events ADD COLUMN IF NOT EXISTS device_type text;
ALTER TABLE public.ad_events ADD COLUMN IF NOT EXISTS browser text;
ALTER TABLE public.ad_events ADD COLUMN IF NOT EXISTS os text;
ALTER TABLE public.ad_events ADD COLUMN IF NOT EXISTS screen_resolution text;
ALTER TABLE public.ad_events ADD COLUMN IF NOT EXISTS referrer text;

-- Add size field to ads table
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS ad_size text NOT NULL DEFAULT 'medium';
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS custom_width integer;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS custom_height integer;

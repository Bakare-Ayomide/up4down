ALTER TABLE public.news ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS file_urls jsonb DEFAULT '[]'::jsonb;
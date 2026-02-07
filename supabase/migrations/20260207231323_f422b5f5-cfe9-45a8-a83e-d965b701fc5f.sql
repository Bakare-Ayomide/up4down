-- Create a storage bucket for download files
INSERT INTO storage.buckets (id, name, public)
VALUES ('downloads', 'downloads', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for public read access
CREATE POLICY "Download files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'downloads');

-- Create policy for admin upload access
CREATE POLICY "Admins can upload download files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'downloads' AND auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

-- Create policy for admin update access
CREATE POLICY "Admins can update download files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'downloads' AND auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

-- Create policy for admin delete access
CREATE POLICY "Admins can delete download files"
ON storage.objects FOR DELETE
USING (bucket_id = 'downloads' AND auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));
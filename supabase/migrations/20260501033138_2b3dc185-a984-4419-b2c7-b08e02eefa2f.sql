-- Add submission tracking columns to subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Storage bucket for payment screenshots (public read so admin/user can view)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: anyone can upload (checkout may be unauthenticated), public can view, admins can delete
DROP POLICY IF EXISTS "Anyone can upload payment screenshots" ON storage.objects;
CREATE POLICY "Anyone can upload payment screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-screenshots');

DROP POLICY IF EXISTS "Payment screenshots are publicly viewable" ON storage.objects;
CREATE POLICY "Payment screenshots are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-screenshots');

DROP POLICY IF EXISTS "Admins can delete payment screenshots" ON storage.objects;
CREATE POLICY "Admins can delete payment screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-screenshots' AND has_role(auth.uid(), 'admin'::app_role));
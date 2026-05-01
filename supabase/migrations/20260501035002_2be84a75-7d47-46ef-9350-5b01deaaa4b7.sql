CREATE TABLE IF NOT EXISTS public.subscription_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  read_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription notifications" ON public.subscription_notifications;
CREATE POLICY "Users can view own subscription notifications"
ON public.subscription_notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark own subscription notifications read" ON public.subscription_notifications;
CREATE POLICY "Users can mark own subscription notifications read"
ON public.subscription_notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage subscription notifications" ON public.subscription_notifications;
CREATE POLICY "Admins can manage subscription notifications"
ON public.subscription_notifications
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_subscription_notifications_user_created
ON public.subscription_notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_subscription_notifications_subscription
ON public.subscription_notifications (subscription_id);

CREATE OR REPLACE FUNCTION public.validate_subscription_payment_submission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF trim(coalesce(NEW.payment_reference, '')) = '' THEN
    RAISE EXCEPTION 'Payment Reference / Transaction ID is required';
  END IF;

  IF trim(coalesce(NEW.screenshot_url, '')) = '' THEN
    RAISE EXCEPTION 'Payment screenshot is required';
  END IF;

  IF trim(coalesce(NEW.email, '')) = '' THEN
    RAISE EXCEPTION 'Payment email is required';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_subscription_payment_submission_trigger ON public.subscriptions;
CREATE TRIGGER validate_subscription_payment_submission_trigger
BEFORE INSERT OR UPDATE OF payment_reference, screenshot_url, email ON public.subscriptions
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.validate_subscription_payment_submission();

ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_notifications;
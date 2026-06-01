-- Channels (group chat rooms similar to Telegram)
CREATE TABLE public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  icon_url text,
  cover_url text,
  is_public boolean NOT NULL DEFAULT true,
  is_announcement_only boolean NOT NULL DEFAULT false,
  created_by uuid,
  member_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.channels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.channels TO authenticated;
GRANT ALL ON public.channels TO service_role;

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Channels viewable by everyone" ON public.channels FOR SELECT USING (true);
CREATE POLICY "Admins manage channels insert" ON public.channels FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage channels update" ON public.channels FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage channels delete" ON public.channels FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON public.channels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Channel members
CREATE TABLE public.channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(channel_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_members TO authenticated;
GRANT ALL ON public.channel_members TO service_role;

ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members visible to authenticated" ON public.channel_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join public channels" ON public.channel_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can add members" ON public.channel_members FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can leave, admins can remove" ON public.channel_members FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update members" ON public.channel_members FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Helper: is member
CREATE OR REPLACE FUNCTION public.is_channel_member(_channel_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.channel_members WHERE channel_id = _channel_id AND user_id = _user_id)
$$;

-- Channel messages
CREATE TABLE public.channel_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_display_name text,
  content text,
  attachment_url text,
  attachment_type text,
  reply_to_id uuid,
  pinned boolean NOT NULL DEFAULT false,
  edited_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_channel_messages_channel ON public.channel_messages(channel_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.channel_messages TO authenticated;
GRANT SELECT ON public.channel_messages TO anon;
GRANT ALL ON public.channel_messages TO service_role;

ALTER TABLE public.channel_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages viewable by everyone for public channels" ON public.channel_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND (c.is_public = true OR public.is_channel_member(c.id, auth.uid())))
);

CREATE POLICY "Members can post" ON public.channel_messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR (
      public.is_channel_member(channel_id, auth.uid())
      AND NOT EXISTS (SELECT 1 FROM public.channels c WHERE c.id = channel_id AND c.is_announcement_only = true)
    )
  )
);

CREATE POLICY "Users edit own messages" ON public.channel_messages FOR UPDATE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users delete own, admins any" ON public.channel_messages FOR DELETE TO authenticated USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Member count trigger
CREATE OR REPLACE FUNCTION public.update_channel_member_count() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.channels SET member_count = member_count + 1 WHERE id = NEW.channel_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.channels SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.channel_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_channel_member_count
AFTER INSERT OR DELETE ON public.channel_members
FOR EACH ROW EXECUTE FUNCTION public.update_channel_member_count();

-- Realtime
ALTER TABLE public.channel_messages REPLICA IDENTITY FULL;
ALTER TABLE public.channels REPLICA IDENTITY FULL;
ALTER TABLE public.channel_members REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;

-- Storage bucket for channel attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('channel-media', 'channel-media', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Channel media public read" ON storage.objects FOR SELECT USING (bucket_id = 'channel-media');
CREATE POLICY "Authenticated upload channel media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'channel-media');
CREATE POLICY "Users delete own channel media" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'channel-media' AND auth.uid()::text = (storage.foldername(name))[1]);


CREATE OR REPLACE FUNCTION public.increment_chat_messages(_bot_id UUID, _chat_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE telegram_connected_chats
  SET messages_processed = messages_processed + 1
  WHERE bot_id = _bot_id AND chat_id = _chat_id;
END;
$$;

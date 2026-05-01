import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useSubscription = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkSubscription();

    const handleSubscriptionChanged = () => checkSubscription();
    window.addEventListener("subscription-status-changed", handleSubscriptionChanged);
    return () => window.removeEventListener("subscription-status-changed", handleSubscriptionChanged);
  }, []);

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsSubscribed(false);
        setLoading(false);
        return;
      }

      setUserId(session.user.id);

      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      setIsSubscribed(!!data);
    } catch {
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  };

  return { isSubscribed, loading, userId, refresh: checkSubscription };
};

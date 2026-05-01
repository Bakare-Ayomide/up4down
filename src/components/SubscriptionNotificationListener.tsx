import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionNotificationPayload {
  id: string;
  title: string;
  message: string;
  type: string;
  user_id: string;
}

export const SubscriptionNotificationListener = () => {
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const attachRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      channel = supabase
        .channel(`subscription-notifications-${session.user.id}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "subscription_notifications", filter: `user_id=eq.${session.user.id}` },
          (payload) => {
            const notification = payload.new as SubscriptionNotificationPayload;
            toast(notification.title, {
              description: notification.message.slice(0, 140),
              action: {
                label: "View",
                onClick: () => { window.location.href = "/account"; },
              },
            });
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "subscriptions", filter: `user_id=eq.${session.user.id}` },
          () => {
            window.dispatchEvent(new CustomEvent("subscription-status-changed"));
          },
        )
        .subscribe();
    };

    attachRealtime();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (channel) supabase.removeChannel(channel);
      channel = null;
      if (session?.user?.id) attachRealtime();
    });

    return () => {
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return null;
};
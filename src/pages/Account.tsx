import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Crown, User, LogOut, Loader2, Save, Bell, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { AdBanner } from "@/components/AdBanner";

interface SubscriptionNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read_at: string | null;
  created_at: string;
}

const Account = () => {
  const navigate = useNavigate();
  const { isSubscribed, loading: subLoading, refresh: refreshSubscriptionStatus } = useSubscription();
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [notifications, setNotifications] = useState<SubscriptionNotification[]>([]);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (!session) { navigate("/auth"); return; }
      fetchProfile(session.user.id);
      fetchSubscription(session.user.id);
      fetchNotifications(session.user.id);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) { navigate("/auth"); return; }
      fetchProfile(session.user.id);
      fetchSubscription(session.user.id);
      fetchNotifications(session.user.id);
      setChecking(false);
    });

    return () => authSub.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel(`account-subscription-${session.user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${session.user.id}` },
        () => {
          fetchSubscription(session.user.id);
          refreshSubscriptionStatus();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "subscription_notifications", filter: `user_id=eq.${session.user.id}` },
        (payload) => {
          const next = payload.new as SubscriptionNotification;
          setNotifications((current) => [next, ...current].slice(0, 10));
          toast(next.title, { description: next.message.slice(0, 120) });
          fetchSubscription(session.user.id);
          refreshSubscriptionStatus();
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session?.user?.id]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", userId)
      .maybeSingle();
    if (data?.display_name) setDisplayName(data.display_name);
    setChecking(false);
  };

  const fetchSubscription = async (userId: string) => {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSubscription(data);
  };

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from("subscription_notifications" as any)
      .select("id,title,message,type,read_at,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    setNotifications((data as unknown as SubscriptionNotification[]) || []);
  };

  const markNotificationRead = async (id: string) => {
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((note) => note.id === id ? { ...note, read_at: readAt } : note));
    await supabase.from("subscription_notifications" as any).update({ read_at: readAt }).eq("id", id);
  };

  const saveProfile = async () => {
    if (!session) return;
    setSaving(true);
    await supabase
      .from("profiles")
      .upsert({ user_id: session.user.id, email: session.user.email, display_name: displayName }, { onConflict: "user_id" });
    toast.success("Profile saved");
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const getDaysRemaining = () => {
    if (!subscription?.expires_at) return null;
    const diff = Math.ceil((new Date(subscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysLeft = getDaysRemaining();
  const expiryDate = subscription?.expires_at ? new Date(subscription.expires_at) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <AdBanner page="account" position="top" />
        <h1 className="text-3xl font-bold">My Account</h1>

        {/* Profile */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{session?.user?.email}</p>
              <p className="text-xs text-muted-foreground">Joined {new Date(session?.user?.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <Label>Display Name</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" className="mt-1" />
          </div>
          <Button onClick={saveProfile} disabled={saving} size="sm" className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Profile
          </Button>
        </Card>

        {/* Subscription */}
        <Card className="p-6 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Subscription
          </h2>

          {notifications.length > 0 && (
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Bell className="h-4 w-4 text-primary" /> Payment Notifications
              </h3>
              {notifications.slice(0, 3).map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => !note.read_at && markNotificationRead(note.id)}
                  className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start gap-3">
                    {note.type === "approved" ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-400" /> : note.type === "rejected" ? <XCircle className="mt-0.5 h-4 w-4 text-destructive" /> : <Bell className="mt-0.5 h-4 w-4 text-primary" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{note.title}</p>
                        {!note.read_at && <Badge className="bg-primary/20 text-primary border-primary/30">NEW</Badge>}
                      </div>
                      <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{note.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{new Date(note.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {subLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isSubscribed ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm px-3 py-1">PREMIUM ACTIVE</Badge>
                {daysLeft !== null && (
                  <span className="text-sm font-mono text-muted-foreground">
                    {daysLeft > 0 ? `${daysLeft} days remaining` : "Expiring today"}
                  </span>
                )}
              </div>

              {/* Countdown + Calendar */}
              {daysLeft !== null && daysLeft > 0 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-muted/50 text-center">
                    <p className="text-5xl font-bold text-primary">{daysLeft}</p>
                    <p className="text-sm text-muted-foreground mt-1">days remaining</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Expires: {expiryDate?.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      className="rounded-md border"
                      modifiers={{ expiry: expiryDate ? [expiryDate] : [] }}
                      modifiersStyles={{
                        expiry: {
                          backgroundColor: "hsl(var(--destructive) / 0.2)",
                          color: "hsl(var(--destructive))",
                          borderRadius: "50%",
                          fontWeight: "bold",
                        },
                      }}
                    />
                  </div>
                </div>
              )}

              {subscription && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Amount: {subscription.amount_paid} {subscription.currency}</p>
                  {subscription.started_at && <p>Started: {new Date(subscription.started_at).toLocaleDateString()}</p>}
                  <p>Status: {subscription.status}</p>
                </div>
              )}
            </div>
          ) : subscription?.status === "pending" ? (
            <div className="space-y-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4">
              <Badge className="w-fit bg-yellow-500/20 text-yellow-400 border-yellow-500/30">PENDING REVIEW</Badge>
              <p className="text-sm text-muted-foreground">Your payment proof was submitted and is waiting for admin review.</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Reference: {subscription.payment_reference}</p>
                <p>Amount: {subscription.amount_paid} {subscription.currency}</p>
              </div>
            </div>
          ) : subscription?.status === "cancelled" ? (
            <div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
              <Badge className="w-fit bg-destructive/20 text-destructive border-destructive/30">REJECTED</Badge>
              <p className="text-sm text-muted-foreground">Your last payment submission was rejected.</p>
              {subscription.rejection_reason && <p className="text-sm whitespace-pre-line">{subscription.rejection_reason}</p>}
              <Button onClick={() => navigate("/payment")} className="gap-2 rounded-xl">
                <Crown className="h-4 w-4" /> Submit New Payment Proof
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-muted-foreground">You're on the free tier</p>
              <Button onClick={() => navigate("/payment")} className="gap-2 rounded-xl">
                <Crown className="h-4 w-4" /> Upgrade to Premium — $0.99/mo
              </Button>
            </div>
          )}
        </Card>

        {/* Logout */}
        <AdBanner page="account" position="inline" />
        <Button variant="outline" onClick={handleLogout} className="w-full gap-2">
          <LogOut className="h-4 w-4" /> Log Out
        </Button>
        <AdBanner page="account" position="bottom" />
      </main>
    </div>
  );
};

export default Account;

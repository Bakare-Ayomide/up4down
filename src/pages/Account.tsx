import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Crown, User, LogOut, Loader2, Save, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";

const Account = () => {
  const navigate = useNavigate();
  const { isSubscribed, loading: subLoading } = useSubscription();
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (!session) { navigate("/auth"); return; }
      fetchProfile(session.user.id);
      fetchSubscription(session.user.id);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) { navigate("/auth"); return; }
      fetchProfile(session.user.id);
      fetchSubscription(session.user.id);
      setChecking(false);
    });

    return () => authSub.unsubscribe();
  }, []);

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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
    <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
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
      <Button variant="outline" onClick={handleLogout} className="w-full gap-2">
        <LogOut className="h-4 w-4" /> Log Out
      </Button>
    </main>
  );
};

export default Account;

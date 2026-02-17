import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogIn, UserPlus, Loader2, Crown } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const { isSubscribed, loading: subLoading } = useSubscription();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCheckingSession(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Fill in all fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) toast.error(error.message);
    else toast.success("Account created! You're now logged in.");
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Fill in all fields"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else toast.success("Welcome back!");
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out");
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Logged in - show account dashboard
  if (session) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-lg">
          <Card className="p-8 border-border bg-card text-center">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">My Account</h1>
            <p className="text-muted-foreground mb-6">{session.user.email}</p>

            <div className="p-4 rounded-xl bg-muted/50 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Subscription Status</p>
              {subLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              ) : isSubscribed ? (
                <span className="text-lg font-bold text-green-500">✅ Premium Active</span>
              ) : (
                <div>
                  <span className="text-lg font-bold text-muted-foreground">Free Tier</span>
                  <Button onClick={() => navigate("/payment")} className="w-full mt-3 rounded-xl" size="sm">
                    <Crown className="mr-2 h-4 w-4" /> Upgrade to Premium
                  </Button>
                </div>
              )}
            </div>

            <Button variant="outline" onClick={handleLogout} className="w-full rounded-xl">
              Log Out
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-md">
        <Tabs defaultValue="login" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="login" className="gap-2">
              <LogIn className="h-4 w-4" /> Login
            </TabsTrigger>
            <TabsTrigger value="signup" className="gap-2">
              <UserPlus className="h-4 w-4" /> Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="p-6 border-border bg-card">
              <h2 className="text-xl font-bold mb-4 text-center">Welcome Back</h2>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="login-pass">Password</Label>
                  <Input id="login-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required className="mt-1" />
                </div>
                <Button type="submit" disabled={loading} className="w-full rounded-xl h-11">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Log In"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="p-6 border-border bg-card">
              <h2 className="text-xl font-bold mb-4 text-center">Create Account</h2>
              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="signup-pass">Password</Label>
                  <Input id="signup-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required className="mt-1" />
                </div>
                <Button type="submit" disabled={loading} className="w-full rounded-xl h-11">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Create Account"}
                </Button>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Auth;

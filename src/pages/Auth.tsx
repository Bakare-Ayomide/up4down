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
import { LogIn, UserPlus, Loader2, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) { toast.error("Enter your email address"); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      setResetSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    }
    setLoading(false);
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

  if (session) {
    navigate("/account");
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Forgot password view
  if (showForgot) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-md">
          <Card className="p-6 border-border bg-card">
            {resetSent ? (
              <div className="text-center space-y-4">
                <CheckCircle className="h-14 w-14 text-primary mx-auto" />
                <h2 className="text-xl font-bold">Check Your Email</h2>
                <p className="text-muted-foreground text-sm">
                  We've sent a password reset link to <strong>{resetEmail}</strong>. 
                  Click the link in the email to set a new password.
                </p>
                <p className="text-xs text-muted-foreground">Didn't receive it? Check your spam folder or try again.</p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setResetSent(false); setResetEmail(""); }} className="flex-1">
                    Try Again
                  </Button>
                  <Button onClick={() => { setShowForgot(false); setResetSent(false); setResetEmail(""); }} className="flex-1">
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <KeyRound className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">Forgot Password?</h2>
                  <p className="text-sm text-muted-foreground mt-1">Enter your email and we'll send you a reset link</p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <Label htmlFor="reset-email">Email Address</Label>
                    <Input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="you@example.com" required className="mt-1" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full rounded-xl h-11">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send Reset Link"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setShowForgot(false)} className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Login
                  </Button>
                </form>
              </>
            )}
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
                <button
                  type="button"
                  onClick={() => setShowForgot(true)}
                  className="w-full text-sm text-primary hover:underline text-center"
                >
                  Forgot your password?
                </button>
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

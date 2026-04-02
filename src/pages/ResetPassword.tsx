import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Lock, CheckCircle } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
      setChecking(false);
    });

    // Also check URL hash for recovery type
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
    
    // Timeout to stop showing loading
    const timer = setTimeout(() => setChecking(false), 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return; }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      setSuccess(true);
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/auth"), 2000);
    }
    setLoading(false);
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

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-12 max-w-md text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Password Reset!</h1>
          <p className="text-muted-foreground">Redirecting you to login...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 max-w-md">
        <Card className="p-6 border-border bg-card">
          <div className="text-center mb-6">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Set New Password</h2>
            <p className="text-sm text-muted-foreground mt-1">Enter your new password below</p>
          </div>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <Label htmlFor="new-pass">New Password</Label>
              <Input id="new-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="confirm-pass">Confirm Password</Label>
              <Input id="confirm-pass" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required className="mt-1" />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl h-11">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset Password"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default ResetPassword;

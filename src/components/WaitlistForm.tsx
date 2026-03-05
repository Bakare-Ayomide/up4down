import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WaitlistFormProps {
  source?: string;
}

export const WaitlistForm = ({ source = "website" }: WaitlistFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("waitlist_emails").insert({ email: email.trim().toLowerCase(), source } as any);
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.info("You're already on the waitlist!");
      else toast.error("Something went wrong");
      return;
    }
    setSuccess(true);
    toast.success("You're on the list!");
  };

  if (success) {
    return (
      <div className="flex items-center gap-3 text-primary">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">You're on the waitlist!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md w-full">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="pl-10"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Waitlist"}
      </Button>
    </form>
  );
};

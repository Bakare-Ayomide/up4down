import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Clock, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface SubWithProfile {
  id: string;
  user_id: string;
  status: string;
  started_at: string | null;
  expires_at: string | null;
  email?: string;
}

export const SubscriptionCalendar = () => {
  const [subs, setSubs] = useState<SubWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => { fetchSubs(); }, []);

  const fetchSubs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("id, user_id, status, started_at, expires_at")
      .eq("status", "active")
      .order("expires_at", { ascending: true });

    if (data) {
      const userIds = data.map(s => s.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      const emailMap = new Map(profiles?.map(p => [p.user_id, p.email]) || []);
      setSubs(data.map(s => ({ ...s, email: emailMap.get(s.user_id) || "Unknown" })));
    }
    setLoading(false);
  };

  const checkExpiring = async () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    try {
      await supabase.functions.invoke("check-expiring-subscriptions");
      await fetchSubs();
      toast.success("Expiry check completed");
    } catch {
      // silent
    }
  };

  // Get dates that have expiring subs
  const expiryDates = subs
    .filter(s => s.expires_at)
    .map(s => new Date(s.expires_at!));

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const exp = new Date(expiresAt);
    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const subsForDate = (date: Date) => {
    return subs.filter(s => {
      if (!s.expires_at) return false;
      const exp = new Date(s.expires_at);
      return exp.toDateString() === date.toDateString();
    });
  };

  const selectedSubs = selectedDate ? subsForDate(selectedDate) : [];

  // Highlight dates with expiring subs
  const modifiers = {
    expiring: expiryDates,
  };

  const modifiersStyles = {
    expiring: {
      backgroundColor: "hsl(var(--destructive) / 0.2)",
      color: "hsl(var(--destructive))",
      borderRadius: "50%",
      fontWeight: "bold" as const,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Calendar</h2>
          <p className="text-muted-foreground">Track premium expiry dates with daily countdown</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSubs} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button size="sm" onClick={checkExpiring} className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Check Expiring
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <div>
              <p className="text-2xl font-bold">{subs.length}</p>
              <p className="text-xs text-muted-foreground">Active Subs</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-2xl font-bold">{subs.filter(s => s.expires_at && getDaysRemaining(s.expires_at) <= 3).length}</p>
              <p className="text-xs text-muted-foreground">Expiring in 3 days</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-2xl font-bold">{subs.filter(s => s.expires_at && getDaysRemaining(s.expires_at) <= 0).length}</p>
              <p className="text-xs text-muted-foreground">Expired Today</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calendar */}
        <Card className="p-4 flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md"
          />
        </Card>

        {/* Selected date details + countdown list */}
        <div className="space-y-4">
          {selectedDate && selectedSubs.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Expiring on {selectedDate.toLocaleDateString()}
              </h3>
              <div className="space-y-2">
                {selectedSubs.map(sub => (
                  <div key={sub.id} className="flex justify-between items-center text-sm p-2 rounded bg-muted/50">
                    <span>{sub.email}</span>
                    <Badge variant="destructive" className="text-xs">Expires</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Countdown list */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Active Subscription Countdowns</h3>
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {subs.map(sub => {
                  const days = sub.expires_at ? getDaysRemaining(sub.expires_at) : 0;
                  const isUrgent = days <= 3;
                  const isExpired = days <= 0;
                  return (
                    <div key={sub.id} className="flex items-center justify-between text-sm p-2.5 rounded-lg border bg-card">
                      <span className="truncate flex-1 mr-2">{sub.email}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`font-mono font-bold ${isExpired ? "text-red-400" : isUrgent ? "text-yellow-400" : "text-green-400"}`}>
                          {isExpired ? "EXPIRED" : `${days}d left`}
                        </span>
                        <div className={`h-2 w-2 rounded-full ${isExpired ? "bg-red-400" : isUrgent ? "bg-yellow-400" : "bg-green-400"}`} />
                      </div>
                    </div>
                  );
                })}
                {subs.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No active subscriptions</p>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Clock, Trash2, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  currency: string;
  amount_paid: number;
  payment_reference: string | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export const SubscriptionManager = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchSubscriptions(); }, [filter]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    let query = supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    if (data) setSubscriptions(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "active") {
      updates.started_at = new Date().toISOString();
      updates.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    const { error } = await supabase.from("subscriptions").update(updates).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Subscription ${status}`);
    fetchSubscriptions();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("subscriptions").delete().eq("id", deleteId);
    toast.success("Deleted");
    setDeleteId(null);
    fetchSubscriptions();
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    expired: "bg-red-500/20 text-red-400 border-red-500/30",
    cancelled: "bg-muted text-muted-foreground border-border",
  };

  const filtered = subscriptions.filter((s) =>
    search ? s.payment_reference?.toLowerCase().includes(search.toLowerCase()) || s.user_id.includes(search) : true
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Subscriptions</h2>
          <p className="text-muted-foreground">Activate, expire, or cancel user subscriptions</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSubscriptions} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by reference or user ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid gap-3">
          {filtered.map((sub) => (
            <Card key={sub.id} className="p-4">
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={statusColors[sub.status]}>{sub.status.toUpperCase()}</Badge>
                    <span className="text-sm font-mono text-muted-foreground truncate">{sub.user_id.slice(0, 8)}...</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {sub.amount_paid} {sub.currency} · Ref: {sub.payment_reference || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(sub.created_at).toLocaleDateString()}
                    {sub.expires_at && ` · Expires: ${new Date(sub.expires_at).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {sub.status === "pending" && (
                    <Button size="sm" onClick={() => updateStatus(sub.id, "active")} className="gap-1 bg-green-600 hover:bg-green-700">
                      <Check className="h-3.5 w-3.5" /> Activate
                    </Button>
                  )}
                  {sub.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(sub.id, "expired")} className="gap-1">
                      <Clock className="h-3.5 w-3.5" /> Expire
                    </Button>
                  )}
                  {sub.status !== "cancelled" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(sub.id, "cancelled")} className="gap-1">
                      <X className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(sub.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No subscriptions found</div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subscription?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

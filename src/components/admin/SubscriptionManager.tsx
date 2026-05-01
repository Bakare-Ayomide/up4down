import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Clock, Trash2, Search, RefreshCw, Eye, Mail, Save } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Subscription {
  id: string;
  user_id: string;
  email: string | null;
  status: string;
  currency: string;
  amount_paid: number;
  payment_reference: string | null;
  screenshot_url: string | null;
  rejection_reason: string | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
}

interface Templates {
  approved_subject: string;
  approved_body: string;
  rejected_subject: string;
  rejected_body: string;
}

const DEFAULT_TEMPLATES: Templates = {
  approved_subject: "🎉 Your Premium Subscription is Active!",
  approved_body:
    "Hi there,\n\nGreat news — your payment has been verified and your Premium subscription is now ACTIVE!\n\nReference: {{reference}}\nAmount: {{amount}} {{currency}}\nExpires: {{expires_at}}\n\nEnjoy unlimited downloads with zero ads.\n\nThanks,\nThe Team",
  rejected_subject: "About your recent payment submission",
  rejected_body:
    "Hi there,\n\nUnfortunately we couldn't verify your recent payment submission.\n\nReference: {{reference}}\nReason: {{reason}}\n\nPlease re-submit at our payment page or reply to this email if you believe this is an error.\n\nThanks,\nThe Team",
};

export const SubscriptionManager = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<Subscription | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [templates, setTemplates] = useState<Templates>(DEFAULT_TEMPLATES);
  const [showTemplates, setShowTemplates] = useState(false);
  const [savingTemplates, setSavingTemplates] = useState(false);

  useEffect(() => { fetchSubscriptions(); }, [filter]);
  useEffect(() => { fetchTemplates(); }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    let query = supabase.from("subscriptions").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data } = await query;
    if (data) setSubscriptions(data as any);
    setLoading(false);
  };

  const fetchTemplates = async () => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "subscription_email_templates").maybeSingle();
    if (data?.value) setTemplates({ ...DEFAULT_TEMPLATES, ...(data.value as any) });
  };

  const saveTemplates = async () => {
    setSavingTemplates(true);
    const { error } = await supabase.from("site_settings").upsert(
      { key: "subscription_email_templates", value: templates as any },
      { onConflict: "key" }
    );
    setSavingTemplates(false);
    if (error) { toast.error("Failed to save templates"); return; }
    toast.success("Templates saved");
  };

  const sendNotificationEmail = async (sub: Subscription, type: "approved" | "rejected", extra?: { reason?: string; expires_at?: string }) => {
    if (!sub.email) { toast.warning("No email on file — skipping notification"); return; }
    // Load SMTP config
    const { data: smtpRow } = await supabase.from("site_settings").select("value").eq("key", "smtp_config").maybeSingle();
    const smtp_config = smtpRow?.value as any;
    if (!smtp_config?.host) { toast.warning("SMTP not configured — email skipped. Configure it in Email settings."); return; }

    const subject = type === "approved" ? templates.approved_subject : templates.rejected_subject;
    let body = type === "approved" ? templates.approved_body : templates.rejected_body;
    const vars: Record<string, string> = {
      reference: sub.payment_reference || "—",
      amount: String(sub.amount_paid),
      currency: sub.currency,
      email: sub.email,
      expires_at: extra?.expires_at ? new Date(extra.expires_at).toLocaleDateString() : "—",
      reason: extra?.reason || "—",
    };
    body = body.replace(/\{\{(\w+)\}\}/g, (_m, k) => vars[k] ?? `{{${k}}}`);

    try {
      const { error } = await supabase.functions.invoke("send-smtp-email", {
        body: { to: sub.email, subject, body, smtp_config },
      });
      if (error) throw error;
      toast.success(`Notification email sent to ${sub.email}`);
    } catch (e: any) {
      toast.error(`Email failed: ${e.message || "unknown error"}`);
    }
  };

  const approve = async (sub: Subscription) => {
    setActionBusy(true);
    const expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("subscriptions").update({
      status: "active",
      started_at: new Date().toISOString(),
      expires_at,
      rejection_reason: null,
    }).eq("id", sub.id);
    if (error) { toast.error("Failed to approve"); setActionBusy(false); return; }
    toast.success("Subscription activated");
    await sendNotificationEmail({ ...sub, status: "active" }, "approved", { expires_at });
    setActionBusy(false);
    setViewing(null);
    fetchSubscriptions();
  };

  const reject = async (sub: Subscription, reason: string) => {
    setActionBusy(true);
    const { error } = await supabase.from("subscriptions").update({
      status: "cancelled",
      rejection_reason: reason,
    }).eq("id", sub.id);
    if (error) { toast.error("Failed to reject"); setActionBusy(false); return; }
    toast.success("Submission rejected");
    await sendNotificationEmail(sub, "rejected", { reason });
    setActionBusy(false);
    setRejectingId(null);
    setRejectReason("");
    setViewing(null);
    fetchSubscriptions();
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
    search ? (s.email?.toLowerCase().includes(search.toLowerCase()) || s.payment_reference?.toLowerCase().includes(search.toLowerCase()) || s.user_id.includes(search)) : true
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Subscriptions</h2>
          <p className="text-muted-foreground">Review payment submissions, approve, or reject with email notifications</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplates(true)} className="gap-2">
            <Mail className="h-4 w-4" /> Email Templates
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSubscriptions} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by email, reference or user ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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
                    {sub.email && <span className="text-sm font-medium truncate">{sub.email}</span>}
                    {sub.screenshot_url && <Badge variant="outline" className="text-xs">📎 Screenshot</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {sub.amount_paid} {sub.currency} · Ref: {sub.payment_reference || "N/A"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(sub.created_at).toLocaleString()}
                    {sub.expires_at && ` · Expires: ${new Date(sub.expires_at).toLocaleDateString()}`}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => setViewing(sub)} className="gap-1">
                    <Eye className="h-3.5 w-3.5" /> View
                  </Button>
                  {sub.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(sub.id, "expired")} className="gap-1">
                      <Clock className="h-3.5 w-3.5" /> Expire
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

      {/* Detail / Approve / Reject modal */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription Submission</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div><Badge className={statusColors[viewing.status]}>{viewing.status.toUpperCase()}</Badge></div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <div>{new Date(viewing.created_at).toLocaleString()}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <div className="font-medium">{viewing.email || "—"}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Amount</Label>
                  <div className="font-medium">{viewing.amount_paid} {viewing.currency}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">User ID</Label>
                  <div className="text-xs font-mono">{viewing.user_id}</div>
                </div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground">Payment Reference / Transaction ID</Label>
                  <div className="font-mono text-sm break-all">{viewing.payment_reference || "—"}</div>
                </div>
                {viewing.rejection_reason && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Previous Rejection Reason</Label>
                    <div className="text-sm">{viewing.rejection_reason}</div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-muted-foreground">Payment Screenshot</Label>
                {viewing.screenshot_url ? (
                  <a href={viewing.screenshot_url} target="_blank" rel="noopener noreferrer" className="block mt-2">
                    <img src={viewing.screenshot_url} alt="Payment proof" className="max-h-96 rounded-lg border border-border hover:opacity-90 transition-opacity" />
                  </a>
                ) : (
                  <div className="text-sm text-muted-foreground mt-1">No screenshot uploaded</div>
                )}
              </div>

              {rejectingId === viewing.id ? (
                <div className="space-y-2 border-t pt-4">
                  <Label>Rejection reason (will be emailed to the user)</Label>
                  <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="e.g. Could not locate this transaction in our records" rows={3} />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => { setRejectingId(null); setRejectReason(""); }}>Cancel</Button>
                    <Button size="sm" variant="destructive" disabled={!rejectReason.trim() || actionBusy} onClick={() => reject(viewing, rejectReason.trim())}>
                      Confirm Rejection & Email User
                    </Button>
                  </div>
                </div>
              ) : (
                <DialogFooter className="gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => setRejectingId(viewing.id)} disabled={actionBusy} className="gap-1">
                    <X className="h-4 w-4" /> Reject
                  </Button>
                  <Button onClick={() => approve(viewing)} disabled={actionBusy} className="gap-1 bg-green-600 hover:bg-green-700">
                    <Check className="h-4 w-4" /> Approve & Activate
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email templates dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Notification Email Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Variables: <code>{"{{email}}"}</code>, <code>{"{{reference}}"}</code>, <code>{"{{amount}}"}</code>, <code>{"{{currency}}"}</code>, <code>{"{{expires_at}}"}</code>, <code>{"{{reason}}"}</code>
            </p>
            <div>
              <Label>✅ Approval — Subject</Label>
              <Input value={templates.approved_subject} onChange={(e) => setTemplates({ ...templates, approved_subject: e.target.value })} />
            </div>
            <div>
              <Label>✅ Approval — Body</Label>
              <Textarea rows={6} value={templates.approved_body} onChange={(e) => setTemplates({ ...templates, approved_body: e.target.value })} />
            </div>
            <div>
              <Label>❌ Rejection — Subject</Label>
              <Input value={templates.rejected_subject} onChange={(e) => setTemplates({ ...templates, rejected_subject: e.target.value })} />
            </div>
            <div>
              <Label>❌ Rejection — Body</Label>
              <Textarea rows={6} value={templates.rejected_body} onChange={(e) => setTemplates({ ...templates, rejected_body: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplates(false)}>Close</Button>
            <Button onClick={saveTemplates} disabled={savingTemplates} className="gap-1">
              <Save className="h-4 w-4" /> {savingTemplates ? "Saving..." : "Save Templates"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

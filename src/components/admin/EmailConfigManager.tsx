import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Save, Loader2, Send, Mail, Inbox, Settings2, RefreshCw } from "lucide-react";

interface SmtpConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  encryption: string;
  enabled: boolean;
}

interface ImapConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: string;
  enabled: boolean;
}

interface EmailMessage {
  id: string;
  subject: string;
  from: string;
  date: string;
  preview: string;
}

const defaultSmtp: SmtpConfig = {
  host: "", port: 587, username: "", password: "", from_email: "", from_name: "Zerolord",
  encryption: "tls", enabled: false,
};

const defaultImap: ImapConfig = {
  host: "", port: 993, username: "", password: "", encryption: "ssl", enabled: false,
};

export const EmailConfigManager = () => {
  const [smtp, setSmtp] = useState<SmtpConfig>(defaultSmtp);
  const [imap, setImap] = useState<ImapConfig>(defaultImap);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Compose state
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);

  // Inbox state
  const [inbox, setInbox] = useState<EmailMessage[]>([]);
  const [fetchingInbox, setFetchingInbox] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    const { data } = await supabase.from("site_settings").select("key, value")
      .in("key", ["smtp_config", "imap_config"]);
    if (data) {
      data.forEach((row: any) => {
        if (row.key === "smtp_config") setSmtp({ ...defaultSmtp, ...row.value });
        if (row.key === "imap_config") setImap({ ...defaultImap, ...row.value });
      });
    }
    setLoading(false);
  };

  const saveConfig = async (key: string, value: any) => {
    setSaving(true);
    // Upsert
    const { data: existing } = await supabase.from("site_settings").select("id").eq("key", key).maybeSingle();
    if (existing) {
      await supabase.from("site_settings").update({ value }).eq("key", key);
    } else {
      await supabase.from("site_settings").insert({ key, value });
    }
    toast.success("Configuration saved!");
    setSaving(false);
  };

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject) { toast.error("Recipient and subject are required"); return; }
    if (!smtp.enabled || !smtp.host) { toast.error("SMTP is not configured. Please set up SMTP first."); return; }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-smtp-email", {
        body: { to: composeTo, subject: composeSubject, body: composeBody, smtp_config: smtp },
      });
      if (error) throw error;
      toast.success("Email sent!");
      setComposeTo(""); setComposeSubject(""); setComposeBody("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send email");
    }
    setSending(false);
  };

  const handleFetchInbox = async () => {
    if (!imap.enabled || !imap.host) { toast.error("IMAP is not configured"); return; }
    setFetchingInbox(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-imap-emails", {
        body: { imap_config: imap },
      });
      if (error) throw error;
      setInbox(data?.emails || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to fetch emails");
    }
    setFetchingInbox(false);
  };

  if (loading) return <p>Loading email config...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Email Configuration</h2>
        <p className="text-muted-foreground">Configure SMTP for sending and IMAP for receiving emails</p>
      </div>

      <Tabs defaultValue="smtp" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="smtp" className="gap-1 text-xs sm:text-sm"><Settings2 className="h-4 w-4" />SMTP</TabsTrigger>
          <TabsTrigger value="imap" className="gap-1 text-xs sm:text-sm"><Inbox className="h-4 w-4" />IMAP</TabsTrigger>
          <TabsTrigger value="compose" className="gap-1 text-xs sm:text-sm"><Send className="h-4 w-4" />Compose</TabsTrigger>
          <TabsTrigger value="inbox" className="gap-1 text-xs sm:text-sm"><Mail className="h-4 w-4" />Inbox</TabsTrigger>
        </TabsList>

        {/* SMTP Config */}
        <TabsContent value="smtp">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Enable SMTP</Label>
              <Switch checked={smtp.enabled} onCheckedChange={v => setSmtp({ ...smtp, enabled: v })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>SMTP Host</Label><Input value={smtp.host} onChange={e => setSmtp({ ...smtp, host: e.target.value })} placeholder="smtp.gmail.com" className="mt-1" /></div>
              <div><Label>Port</Label><Input type="number" value={smtp.port} onChange={e => setSmtp({ ...smtp, port: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>Username</Label><Input value={smtp.username} onChange={e => setSmtp({ ...smtp, username: e.target.value })} placeholder="your@email.com" className="mt-1" /></div>
              <div><Label>Password</Label><Input type="password" value={smtp.password} onChange={e => setSmtp({ ...smtp, password: e.target.value })} className="mt-1" /></div>
              <div><Label>From Email</Label><Input value={smtp.from_email} onChange={e => setSmtp({ ...smtp, from_email: e.target.value })} placeholder="noreply@zerolord.com" className="mt-1" /></div>
              <div><Label>From Name</Label><Input value={smtp.from_name} onChange={e => setSmtp({ ...smtp, from_name: e.target.value })} placeholder="Zerolord" className="mt-1" /></div>
            </div>
            <Button onClick={() => saveConfig("smtp_config", smtp)} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save SMTP
            </Button>
          </Card>
        </TabsContent>

        {/* IMAP Config */}
        <TabsContent value="imap">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Enable IMAP</Label>
              <Switch checked={imap.enabled} onCheckedChange={v => setImap({ ...imap, enabled: v })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>IMAP Host</Label><Input value={imap.host} onChange={e => setImap({ ...imap, host: e.target.value })} placeholder="imap.gmail.com" className="mt-1" /></div>
              <div><Label>Port</Label><Input type="number" value={imap.port} onChange={e => setImap({ ...imap, port: Number(e.target.value) })} className="mt-1" /></div>
              <div><Label>Username</Label><Input value={imap.username} onChange={e => setImap({ ...imap, username: e.target.value })} placeholder="your@email.com" className="mt-1" /></div>
              <div><Label>Password</Label><Input type="password" value={imap.password} onChange={e => setImap({ ...imap, password: e.target.value })} className="mt-1" /></div>
            </div>
            <Button onClick={() => saveConfig("imap_config", imap)} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save IMAP
            </Button>
          </Card>
        </TabsContent>

        {/* Compose */}
        <TabsContent value="compose">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Compose Email</h3>
            <div><Label>To</Label><Input value={composeTo} onChange={e => setComposeTo(e.target.value)} placeholder="recipient@email.com" className="mt-1" /></div>
            <div><Label>Subject</Label><Input value={composeSubject} onChange={e => setComposeSubject(e.target.value)} placeholder="Email subject" className="mt-1" /></div>
            <div><Label>Body</Label><Textarea value={composeBody} onChange={e => setComposeBody(e.target.value)} placeholder="Write your message..." rows={8} className="mt-1" /></div>
            <Button onClick={handleSendEmail} disabled={sending} className="gap-2">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send Email
            </Button>
          </Card>
        </TabsContent>

        {/* Inbox */}
        <TabsContent value="inbox">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Inbox</h3>
              <Button variant="outline" onClick={handleFetchInbox} disabled={fetchingInbox} className="gap-2">
                <RefreshCw className={`h-4 w-4 ${fetchingInbox ? "animate-spin" : ""}`} /> Refresh
              </Button>
            </div>
            {inbox.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">
                {fetchingInbox ? "Fetching emails..." : "No emails loaded. Configure IMAP and click Refresh."}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {inbox.map((msg, i) => (
                  <div key={msg.id || i} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-medium text-sm truncate">{msg.from}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{msg.date}</span>
                    </div>
                    <p className="text-sm font-medium truncate">{msg.subject}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.preview}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

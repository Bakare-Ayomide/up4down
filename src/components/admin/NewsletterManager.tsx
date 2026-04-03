import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, Mail, Clock, Users, FileText } from "lucide-react";
import { toast } from "sonner";

interface NewsletterLog {
  id: string;
  subject: string;
  content: string;
  content_type: string;
  recipient_count: number;
  trigger_type: string;
  news_id: string | null;
  sent_at: string;
}

export const NewsletterManager = () => {
  const [logs, setLogs] = useState<NewsletterLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  // Compose state
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [isHtml, setIsHtml] = useState(true);

  // Auto-newsletter settings
  const [autoEnabled, setAutoEnabled] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [logsRes, subsRes, settingsRes] = await Promise.all([
      supabase.from("newsletter_logs").select("*").order("sent_at", { ascending: false }).limit(50),
      supabase.from("waitlist_emails").select("id", { count: "exact", head: true }),
      supabase.from("site_settings").select("value").eq("key", "newsletter_settings").single(),
    ]);
    if (logsRes.data) setLogs(logsRes.data as any);
    setSubscriberCount(subsRes.count || 0);
    if (settingsRes.data?.value) {
      const val = settingsRes.data.value as any;
      setAutoEnabled(val.auto_on_publish || false);
    }
    setLoading(false);
  };

  const saveAutoSettings = async (enabled: boolean) => {
    setAutoEnabled(enabled);
    const { error } = await supabase.from("site_settings").upsert({
      key: "newsletter_settings",
      value: { auto_on_publish: enabled },
    } as any, { onConflict: "key" });
    if (error) toast.error("Failed to save");
    else toast.success(enabled ? "Auto-newsletter enabled" : "Auto-newsletter disabled");
  };

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Subject and content are required");
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-newsletter", {
        body: { subject, content, contentType: isHtml ? "html" : "plain" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Log it
      await supabase.from("newsletter_logs").insert({
        subject,
        content,
        content_type: isHtml ? "html" : "plain",
        recipient_count: data.sent || 0,
        trigger_type: "manual",
      });

      toast.success(`Newsletter sent to ${data.sent} subscribers!`);
      setSubject("");
      setContent("");
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "Failed to send newsletter");
    } finally {
      setSending(false);
    }
  };

  const templateVars = [
    { var: "{{site_name}}", desc: "Your site name (Zerolord)" },
    { var: "{{date}}", desc: "Current date" },
    { var: "{{year}}", desc: "Current year" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Newsletter</h2>
          <p className="text-muted-foreground">Send newsletters to {subscriberCount} waitlist subscribers</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" /> {subscriberCount} subscribers
        </Badge>
      </div>

      <Tabs defaultValue="compose" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="compose" className="gap-1 text-xs sm:text-sm"><Send className="h-4 w-4" />Compose</TabsTrigger>
          <TabsTrigger value="auto" className="gap-1 text-xs sm:text-sm"><FileText className="h-4 w-4" />Auto</TabsTrigger>
          <TabsTrigger value="history" className="gap-1 text-xs sm:text-sm"><Clock className="h-4 w-4" />History</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <Card className="p-6 space-y-4">
            <div>
              <Label>Subject *</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Newsletter subject line..." className="mt-1" />
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={isHtml} onCheckedChange={setIsHtml} />
              <Label>{isHtml ? "HTML" : "Plain Text"}</Label>
            </div>

            <div>
              <Label>Content *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={isHtml ? "<h1>Hello!</h1>\n<p>Check out our latest updates...</p>" : "Hello!\n\nCheck out our latest updates..."}
                rows={12}
                className="mt-1 font-mono text-sm"
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1">
              <p className="font-semibold text-sm mb-2">Available Variables:</p>
              {templateVars.map((v) => (
                <div key={v.var} className="flex gap-2">
                  <code className="text-primary">{v.var}</code>
                  <span className="text-muted-foreground">— {v.desc}</span>
                </div>
              ))}
            </div>

            {isHtml && content && (
              <div>
                <Label className="mb-2 block">Preview</Label>
                <Card className="p-4 prose prose-sm dark:prose-invert max-w-none overflow-auto max-h-[300px]">
                  <div dangerouslySetInnerHTML={{ __html: content.replace(/\{\{site_name\}\}/g, "Zerolord").replace(/\{\{date\}\}/g, new Date().toLocaleDateString()).replace(/\{\{year\}\}/g, String(new Date().getFullYear())) }} />
                </Card>
              </div>
            )}

            <Button onClick={handleSend} disabled={sending || subscriberCount === 0} className="gap-2 w-full">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send to {subscriberCount} Subscribers
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="auto">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Auto-Newsletter on News Publish</h3>
            <p className="text-sm text-muted-foreground">
              When enabled, a newsletter will automatically be sent to all waitlist subscribers whenever a news article is published.
            </p>
            <div className="flex items-center gap-3">
              <Switch checked={autoEnabled} onCheckedChange={saveAutoSettings} />
              <Label>{autoEnabled ? "Enabled" : "Disabled"}</Label>
            </div>
            {autoEnabled && (
              <div className="p-3 rounded-lg bg-primary/10 text-sm">
                <p>✅ Auto-newsletter is active. When you publish a news article, subscribers will receive an email with the article title, excerpt, and a link to read more.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="history">
          {loading ? <p>Loading...</p> : logs.length === 0 ? (
            <Card className="p-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No newsletters sent yet</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <Card key={log.id} className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm truncate">{log.subject}</span>
                        <Badge variant="outline" className="text-xs shrink-0">{log.trigger_type}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Sent to {log.recipient_count} subscribers · {new Date(log.sent_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

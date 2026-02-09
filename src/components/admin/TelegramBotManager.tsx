import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Trash2, RefreshCw, ExternalLink, CheckCircle2, XCircle, Loader2, Hash, Users, Megaphone, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface TelegramBot {
  id: string;
  name: string;
  bot_token: string;
  bot_username: string | null;
  is_active: boolean;
  webhook_url: string | null;
  created_at: string;
}

interface ConnectedChat {
  id: string;
  bot_id: string;
  chat_id: number;
  chat_title: string | null;
  chat_type: string;
  is_active: boolean;
  messages_processed: number;
  last_message_at: string | null;
  created_at: string;
}

const chatTypeIcon = (type: string) => {
  switch (type) {
    case "channel": return <Megaphone className="h-4 w-4" />;
    case "group":
    case "supergroup": return <Users className="h-4 w-4" />;
    default: return <Hash className="h-4 w-4" />;
  }
};

const chatTypeLabel = (type: string) => {
  switch (type) {
    case "channel": return "Channel";
    case "group": return "Group";
    case "supergroup": return "Supergroup";
    case "private": return "Private";
    default: return "Unknown";
  }
};

export const TelegramBotManager = () => {
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [chats, setChats] = useState<ConnectedChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [settingUpBot, setSettingUpBot] = useState<string | null>(null);
  const [expandedBots, setExpandedBots] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({ name: "", bot_token: "" });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [botsRes, chatsRes] = await Promise.all([
      supabase.from("telegram_bots").select("*").order("created_at", { ascending: false }),
      supabase.from("telegram_connected_chats").select("*").order("last_message_at", { ascending: false }),
    ]);

    if (botsRes.error) toast.error("Failed to fetch bots");
    else setBots(botsRes.data || []);

    if (!chatsRes.error) setChats(chatsRes.data || []);
    setLoading(false);
  };

  const toggleExpand = (botId: string) => {
    setExpandedBots(prev => {
      const next = new Set(prev);
      next.has(botId) ? next.delete(botId) : next.add(botId);
      return next;
    });
  };

  const addBot = async () => {
    if (!formData.name || !formData.bot_token) {
      toast.error("Please fill in all fields");
      return;
    }

    const { data, error } = await supabase
      .from("telegram_bots")
      .insert({ name: formData.name, bot_token: formData.bot_token })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add bot: " + error.message);
    } else {
      toast.success("Bot added!");
      setBots([data, ...bots]);
      setFormData({ name: "", bot_token: "" });
      setShowAddDialog(false);
      setupWebhook(data.id, data.bot_token);
    }
  };

  const setupWebhook = async (botId: string, botToken: string) => {
    setSettingUpBot(botId);
    try {
      const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/telegram-webhook?bot_id=${botId}`;

      const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message", "channel_post"] }),
      });
      const result = await response.json();
      if (!result.ok) throw new Error(result.description || "Failed to set webhook");

      const botInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
      const botInfo = await botInfoRes.json();

      await supabase
        .from("telegram_bots")
        .update({ webhook_url: webhookUrl, bot_username: botInfo.result?.username || null })
        .eq("id", botId);

      toast.success(`Webhook configured! Add @${botInfo.result?.username} to your channels/groups.`);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to setup webhook: " + error.message);
    } finally {
      setSettingUpBot(null);
    }
  };

  const toggleBot = async (bot: TelegramBot) => {
    const { error } = await supabase
      .from("telegram_bots")
      .update({ is_active: !bot.is_active })
      .eq("id", bot.id);

    if (error) toast.error("Failed to update bot");
    else {
      setBots(bots.map(b => b.id === bot.id ? { ...b, is_active: !b.is_active } : b));
      toast.success(bot.is_active ? "Bot disabled" : "Bot enabled");
    }
  };

  const deleteBot = async (botId: string) => {
    const { error } = await supabase.from("telegram_bots").delete().eq("id", botId);
    if (error) toast.error("Failed to delete bot");
    else {
      setBots(bots.filter(b => b.id !== botId));
      setChats(chats.filter(c => c.bot_id !== botId));
      toast.success("Bot deleted");
    }
  };

  const getChatsByBot = (botId: string) => chats.filter(c => c.bot_id === botId);

  const groupChatsByType = (botChats: ConnectedChat[]) => {
    const groups: Record<string, ConnectedChat[]> = {};
    botChats.forEach(chat => {
      const type = chat.chat_type === "supergroup" ? "group" : chat.chat_type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(chat);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Telegram Bots</h3>
          <p className="text-sm text-muted-foreground">
            Auto-upload files from Telegram channels and groups
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Telegram Bot</DialogTitle>
              <DialogDescription>
                Create a bot via @BotFather on Telegram and paste the token here.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Bot Name</Label>
                <Input
                  id="name"
                  placeholder="My Upload Bot"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="token">Bot Token</Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                  value={formData.bot_token}
                  onChange={(e) => setFormData({ ...formData, bot_token: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Get this from @BotFather after creating a new bot
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button onClick={addBot}>Add Bot</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      {bots.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{bots.length}</p>
                  <p className="text-xs text-muted-foreground">Total Bots</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Megaphone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{chats.filter(c => c.chat_type === "channel").length}</p>
                  <p className="text-xs text-muted-foreground">Channels</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{chats.filter(c => c.chat_type === "group" || c.chat_type === "supergroup").length}</p>
                  <p className="text-xs text-muted-foreground">Groups</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {bots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No bots configured</h4>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Add a Telegram bot to automatically upload files from your channels and groups
            </p>
            <Button onClick={() => setShowAddDialog(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Bot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bots.map((bot) => {
            const botChats = getChatsByBot(bot.id);
            const grouped = groupChatsByType(botChats);
            const isExpanded = expandedBots.has(bot.id);

            return (
              <Card key={bot.id} className={!bot.is_active ? "opacity-60" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {bot.name}
                          {bot.is_active ? (
                            <Badge variant="outline" className="gap-1 text-primary border-primary/30">
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-muted-foreground">
                              <XCircle className="h-3 w-3" /> Inactive
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          {bot.bot_username ? `@${bot.bot_username}` : "Username pending..."}
                          {botChats.length > 0 && (
                            <span className="text-xs">· {botChats.length} connected chat{botChats.length !== 1 ? "s" : ""}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <Switch checked={bot.is_active} onCheckedChange={() => toggleBot(bot)} />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {!bot.webhook_url && (
                      <Button
                        size="sm" variant="outline"
                        onClick={() => setupWebhook(bot.id, bot.bot_token)}
                        disabled={settingUpBot === bot.id}
                        className="gap-2"
                      >
                        {settingUpBot === bot.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Setup Webhook
                      </Button>
                    )}
                    {bot.bot_username && (
                      <Button size="sm" variant="outline" asChild className="gap-2">
                        <a href={`https://t.me/${bot.bot_username}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3" /> Open in Telegram
                        </a>
                      </Button>
                    )}
                    <Button
                      size="sm" variant="outline"
                      onClick={() => deleteBot(bot.id)}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </Button>
                  </div>

                  {bot.webhook_url && botChats.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      📌 Add this bot to your Telegram channels or groups as admin. Connected chats will appear here.
                    </p>
                  )}

                  {/* Connected Chats */}
                  {botChats.length > 0 && (
                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(bot.id)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-2 w-full justify-between text-muted-foreground hover:text-foreground">
                          <span className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            Connected Chats ({botChats.length})
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 space-y-3">
                        {Object.entries(grouped).map(([type, typeChats]) => (
                          <div key={type}>
                            <div className="flex items-center gap-2 mb-2">
                              {chatTypeIcon(type)}
                              <span className="text-sm font-medium capitalize">{type === "group" ? "Groups" : `${chatTypeLabel(type)}s`}</span>
                              <Badge variant="secondary" className="text-xs">{typeChats.length}</Badge>
                            </div>
                            <div className="grid gap-2 pl-6">
                              {typeChats.map(chat => (
                                <div
                                  key={chat.id}
                                  className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {chatTypeIcon(chat.chat_type)}
                                    <span className="text-sm font-medium truncate">{chat.chat_title || `Chat ${chat.chat_id}`}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                                    <span>{chat.messages_processed} msgs</span>
                                    {chat.last_message_at && (
                                      <span>{new Date(chat.last_message_at).toLocaleDateString()}</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

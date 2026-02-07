import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Trash2, RefreshCw, ExternalLink, CheckCircle2, XCircle, Loader2 } from "lucide-react";
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

interface TelegramBot {
  id: string;
  name: string;
  bot_token: string;
  bot_username: string | null;
  is_active: boolean;
  webhook_url: string | null;
  created_at: string;
}

export const TelegramBotManager = () => {
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [settingUpBot, setSettingUpBot] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    bot_token: "",
  });

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    const { data, error } = await supabase
      .from("telegram_bots")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch bots");
      console.error(error);
    } else {
      setBots(data || []);
    }
    setLoading(false);
  };

  const addBot = async () => {
    if (!formData.name || !formData.bot_token) {
      toast.error("Please fill in all fields");
      return;
    }

    const { data, error } = await supabase
      .from("telegram_bots")
      .insert({
        name: formData.name,
        bot_token: formData.bot_token,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add bot: " + error.message);
    } else {
      toast.success("Bot added successfully!");
      setBots([data, ...bots]);
      setFormData({ name: "", bot_token: "" });
      setShowAddDialog(false);
      // Auto setup webhook
      setupWebhook(data.id, data.bot_token);
    }
  };

  const setupWebhook = async (botId: string, botToken: string) => {
    setSettingUpBot(botId);
    try {
      const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const webhookUrl = `https://${projectRef}.supabase.co/functions/v1/telegram-webhook?bot_id=${botId}`;

      // Call Telegram API to set webhook
      const response = await fetch(
        `https://api.telegram.org/bot${botToken}/setWebhook`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: webhookUrl,
            allowed_updates: ["message", "channel_post"],
          }),
        }
      );

      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.description || "Failed to set webhook");
      }

      // Get bot info
      const botInfoRes = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`
      );
      const botInfo = await botInfoRes.json();

      // Update bot in database
      await supabase
        .from("telegram_bots")
        .update({
          webhook_url: webhookUrl,
          bot_username: botInfo.result?.username || null,
        })
        .eq("id", botId);

      toast.success(`Webhook configured! Add @${botInfo.result?.username} to your channel.`);
      fetchBots();
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

    if (error) {
      toast.error("Failed to update bot");
    } else {
      setBots(bots.map(b => b.id === bot.id ? { ...b, is_active: !b.is_active } : b));
      toast.success(bot.is_active ? "Bot disabled" : "Bot enabled");
    }
  };

  const deleteBot = async (botId: string) => {
    const { error } = await supabase
      .from("telegram_bots")
      .delete()
      .eq("id", botId);

    if (error) {
      toast.error("Failed to delete bot");
    } else {
      setBots(bots.filter(b => b.id !== botId));
      toast.success("Bot deleted");
    }
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
            Configure bots to auto-upload files from Telegram channels
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
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addBot}>Add Bot</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {bots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">No bots configured</h4>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
              Add a Telegram bot to automatically upload files from your channels
            </p>
            <Button onClick={() => setShowAddDialog(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Your First Bot
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bots.map((bot) => (
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
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-muted-foreground">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {bot.bot_username ? `@${bot.bot_username}` : "Username pending..."}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={bot.is_active}
                      onCheckedChange={() => toggleBot(bot)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {!bot.webhook_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setupWebhook(bot.id, bot.bot_token)}
                      disabled={settingUpBot === bot.id}
                      className="gap-2"
                    >
                      {settingUpBot === bot.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3 w-3" />
                      )}
                      Setup Webhook
                    </Button>
                  )}
                  {bot.bot_username && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="gap-2"
                    >
                      <a
                        href={`https://t.me/${bot.bot_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open in Telegram
                      </a>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteBot(bot.id)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
                {bot.webhook_url && (
                  <p className="text-xs text-muted-foreground mt-3">
                    📌 Add this bot to your Telegram channel as admin. Any files sent will be auto-uploaded.
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

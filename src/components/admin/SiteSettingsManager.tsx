import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, DollarSign, Shield, Megaphone, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const SiteSettingsManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [price, setPrice] = useState({ amount: 0.99, currency: "USD" });
  const [limits, setLimits] = useState({ daily_limit: 3, monthly_limit: 20 });
  const [ads, setAds] = useState({
    ad_urls: [] as string[],
    adsense_enabled: false,
    adsense_client_id: "",
    ad_slot_id: "",
    custom_js_enabled: true,
  });
  const [payment, setPayment] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
    routing_number: "",
    instructions: "",
    payment_methods: [] as string[],
  });

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      data.forEach((row: any) => {
        if (row.key === "subscription_price") setPrice(row.value);
        if (row.key === "free_tier_limits") setLimits(row.value);
        if (row.key === "ad_settings") setAds(row.value);
        if (row.key === "payment_settings") setPayment(row.value);
      });
    }
    setLoading(false);
  };

  const saveSetting = async (key: string, value: any) => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").update({ value }).eq("key", key);
    if (error) toast.error("Failed to save");
    else toast.success("Settings saved!");
    setSaving(false);
  };

  if (loading) return <p>Loading settings...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Site Settings</h2>
        <p className="text-muted-foreground">Configure pricing, limits, ads, and payment details</p>
      </div>

      <Tabs defaultValue="pricing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 h-12">
          <TabsTrigger value="pricing" className="gap-1 text-xs sm:text-sm"><DollarSign className="h-4 w-4" />Pricing</TabsTrigger>
          <TabsTrigger value="limits" className="gap-1 text-xs sm:text-sm"><Shield className="h-4 w-4" />Limits</TabsTrigger>
          <TabsTrigger value="ads" className="gap-1 text-xs sm:text-sm"><Megaphone className="h-4 w-4" />Ads</TabsTrigger>
          <TabsTrigger value="payment" className="gap-1 text-xs sm:text-sm"><CreditCard className="h-4 w-4" />Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing">
          <Card className="p-6 space-y-4">
            <div>
              <Label>Subscription Price (USD)</Label>
              <Input type="number" step="0.01" value={price.amount} onChange={(e) => setPrice({ ...price, amount: parseFloat(e.target.value) || 0 })} className="mt-1" />
            </div>
            <Button onClick={() => saveSetting("subscription_price", price)} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Pricing
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="limits">
          <Card className="p-6 space-y-4">
            <div>
              <Label>Daily Download Limit (Free Tier)</Label>
              <Input type="number" value={limits.daily_limit} onChange={(e) => setLimits({ ...limits, daily_limit: parseInt(e.target.value) || 0 })} className="mt-1" />
            </div>
            <div>
              <Label>Monthly Download Limit (Free Tier)</Label>
              <Input type="number" value={limits.monthly_limit} onChange={(e) => setLimits({ ...limits, monthly_limit: parseInt(e.target.value) || 0 })} className="mt-1" />
            </div>
            <Button onClick={() => saveSetting("free_tier_limits", limits)} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Limits
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="ads">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Custom JS Ads (existing ad system)</Label>
              <Switch checked={ads.custom_js_enabled} onCheckedChange={(v) => setAds({ ...ads, custom_js_enabled: v })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Enable Google AdSense</Label>
              <Switch checked={ads.adsense_enabled} onCheckedChange={(v) => setAds({ ...ads, adsense_enabled: v })} />
            </div>
            {ads.adsense_enabled && (
              <>
                <div>
                  <Label>AdSense Client ID</Label>
                  <Input value={ads.adsense_client_id} onChange={(e) => setAds({ ...ads, adsense_client_id: e.target.value })} placeholder="ca-pub-XXXXXXX" className="mt-1" />
                </div>
                <div>
                  <Label>Ad Slot ID</Label>
                  <Input value={ads.ad_slot_id} onChange={(e) => setAds({ ...ads, ad_slot_id: e.target.value })} placeholder="1234567890" className="mt-1" />
                </div>
              </>
            )}
            <p className="text-xs text-muted-foreground">
              For Adsterra and other external ad platforms, use the <strong>Ad Snippets</strong> section in the sidebar to manage code snippets dynamically.
            </p>
            <div>
              <Label>Ad Redirect URLs (one per line)</Label>
              <Textarea
                value={ads.ad_urls.join("\n")}
                onChange={(e) => setAds({ ...ads, ad_urls: e.target.value.split("\n").filter((u) => u.trim()) })}
                placeholder="https://ad-network.com/your-link"
                rows={4}
                className="mt-1"
              />
            </div>
            <Button onClick={() => saveSetting("ad_settings", ads)} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Ad Settings
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card className="p-6 space-y-4">
            <div>
              <Label>Bank Name</Label>
              <Input value={payment.bank_name} onChange={(e) => setPayment({ ...payment, bank_name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Account Name</Label>
              <Input value={payment.account_name} onChange={(e) => setPayment({ ...payment, account_name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input value={payment.account_number} onChange={(e) => setPayment({ ...payment, account_number: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Routing / SWIFT Code</Label>
              <Input value={payment.routing_number} onChange={(e) => setPayment({ ...payment, routing_number: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Payment Instructions</Label>
              <Textarea value={payment.instructions} onChange={(e) => setPayment({ ...payment, instructions: e.target.value })} rows={3} className="mt-1" />
            </div>
            <Button onClick={() => saveSetting("payment_settings", payment)} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Payment Details
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

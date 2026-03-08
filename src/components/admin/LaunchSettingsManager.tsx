import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2, Globe, Search, Share2, Store, BarChart3, FileText, Zap } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const LaunchSettingsManager = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [appSettings, setAppSettings] = useState({
    app_name: "Zerolord", app_description: "", support_email: "", support_url: "",
    privacy_policy_url: "", terms_of_service_url: "", website_url: "",
  });
  const [seoSettings, setSeoSettings] = useState({
    meta_title: "", meta_description: "", meta_keywords: "",
    og_title: "", og_description: "", og_image: "", og_url: "",
    twitter_card_type: "summary_large_image", twitter_title: "", twitter_description: "", twitter_image: "",
  });
  const [socialLinks, setSocialLinks] = useState({
    twitter_url: "", instagram_url: "", facebook_url: "", youtube_url: "", telegram_url: "", discord_url: "",
    visible_icons: { twitter_url: true, instagram_url: true, facebook_url: true, youtube_url: true, telegram_url: true, discord_url: true } as Record<string, boolean>,
  });
  const [appStore, setAppStore] = useState({
    app_store_keywords: "", short_description: "", long_description: "",
    promotional_text: "", app_store_support_url: "", app_store_marketing_url: "",
  });
  const [analytics, setAnalytics] = useState({ google_analytics_id: "", facebook_pixel_id: "" });
  const [indexnow, setIndexnow] = useState({ enabled: false, api_key: "" });
  const [robots, setRobots] = useState({ indexing_enabled: true, custom_rules: "" });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data } = await supabase.from("site_settings").select("key, value");
    if (data) {
      data.forEach((r: any) => {
        if (r.key === "app_settings") setAppSettings(prev => ({ ...prev, ...r.value }));
        if (r.key === "seo_settings") setSeoSettings(prev => ({ ...prev, ...r.value }));
        if (r.key === "social_links") setSocialLinks(prev => ({ ...prev, ...r.value }));
        if (r.key === "app_store_settings") setAppStore(prev => ({ ...prev, ...r.value }));
        if (r.key === "analytics_settings") setAnalytics(prev => ({ ...prev, ...r.value }));
        if (r.key === "indexnow_settings") setIndexnow(prev => ({ ...prev, ...r.value }));
        if (r.key === "robots_settings") setRobots(prev => ({ ...prev, ...r.value }));
      });
    }
    setLoading(false);
  };

  const save = async (key: string, value: any) => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").update({ value }).eq("key", key);
    if (error) toast.error("Failed to save");
    else toast.success("Saved!");
    setSaving(false);
  };

  const SaveBtn = ({ onClick }: { onClick: () => void }) => (
    <Button onClick={onClick} disabled={saving} className="gap-2 mt-4">
      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
    </Button>
  );

  const Field = ({ label, value, onChange, textarea, placeholder }: any) => (
    <div>
      <Label>{label}</Label>
      {textarea ? (
        <Textarea value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="mt-1" />
      ) : (
        <Input value={value} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} className="mt-1" />
      )}
    </div>
  );

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Launch & SEO Settings</h2>
        <p className="text-muted-foreground">Configure app, SEO, social, analytics, and more</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="general" className="gap-1 text-xs"><Globe className="h-3.5 w-3.5" />General</TabsTrigger>
          <TabsTrigger value="seo" className="gap-1 text-xs"><Search className="h-3.5 w-3.5" />SEO</TabsTrigger>
          <TabsTrigger value="social" className="gap-1 text-xs"><Share2 className="h-3.5 w-3.5" />Social</TabsTrigger>
          <TabsTrigger value="appstore" className="gap-1 text-xs"><Store className="h-3.5 w-3.5" />App Store</TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1 text-xs"><BarChart3 className="h-3.5 w-3.5" />Analytics</TabsTrigger>
          <TabsTrigger value="sitemap" className="gap-1 text-xs"><FileText className="h-3.5 w-3.5" />Sitemap</TabsTrigger>
          <TabsTrigger value="indexnow" className="gap-1 text-xs"><Zap className="h-3.5 w-3.5" />IndexNow</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="p-6 space-y-4">
            <Field label="App Name" value={appSettings.app_name} onChange={(v: string) => setAppSettings(p => ({ ...p, app_name: v }))} />
            <Field label="App Description" value={appSettings.app_description} onChange={(v: string) => setAppSettings(p => ({ ...p, app_description: v }))} textarea />
            <Field label="Support Email" value={appSettings.support_email} onChange={(v: string) => setAppSettings(p => ({ ...p, support_email: v }))} placeholder="support@zerolord.com" />
            <Field label="Support URL" value={appSettings.support_url} onChange={(v: string) => setAppSettings(p => ({ ...p, support_url: v }))} />
            <Field label="Privacy Policy URL" value={appSettings.privacy_policy_url} onChange={(v: string) => setAppSettings(p => ({ ...p, privacy_policy_url: v }))} />
            <Field label="Terms of Service URL" value={appSettings.terms_of_service_url} onChange={(v: string) => setAppSettings(p => ({ ...p, terms_of_service_url: v }))} />
            <Field label="Website URL" value={appSettings.website_url} onChange={(v: string) => setAppSettings(p => ({ ...p, website_url: v }))} />
            <SaveBtn onClick={() => save("app_settings", appSettings)} />
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card className="p-6 space-y-4">
            <Field label="Meta Title" value={seoSettings.meta_title} onChange={(v: string) => setSeoSettings(p => ({ ...p, meta_title: v }))} />
            <Field label="Meta Description" value={seoSettings.meta_description} onChange={(v: string) => setSeoSettings(p => ({ ...p, meta_description: v }))} textarea />
            <Field label="Meta Keywords (comma-separated)" value={seoSettings.meta_keywords} onChange={(v: string) => setSeoSettings(p => ({ ...p, meta_keywords: v }))} />
            <Field label="OG Title" value={seoSettings.og_title} onChange={(v: string) => setSeoSettings(p => ({ ...p, og_title: v }))} />
            <Field label="OG Description" value={seoSettings.og_description} onChange={(v: string) => setSeoSettings(p => ({ ...p, og_description: v }))} textarea />
            <Field label="OG Image URL" value={seoSettings.og_image} onChange={(v: string) => setSeoSettings(p => ({ ...p, og_image: v }))} />
            <Field label="OG URL" value={seoSettings.og_url} onChange={(v: string) => setSeoSettings(p => ({ ...p, og_url: v }))} />
            <Field label="Twitter Card Type" value={seoSettings.twitter_card_type} onChange={(v: string) => setSeoSettings(p => ({ ...p, twitter_card_type: v }))} placeholder="summary_large_image" />
            <Field label="Twitter Title" value={seoSettings.twitter_title} onChange={(v: string) => setSeoSettings(p => ({ ...p, twitter_title: v }))} />
            <Field label="Twitter Description" value={seoSettings.twitter_description} onChange={(v: string) => setSeoSettings(p => ({ ...p, twitter_description: v }))} textarea />
            <Field label="Twitter Image URL" value={seoSettings.twitter_image} onChange={(v: string) => setSeoSettings(p => ({ ...p, twitter_image: v }))} />
            <SaveBtn onClick={() => save("seo_settings", seoSettings)} />
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Social Media Links & Visibility</h3>
            {[
              { key: "twitter_url", label: "Twitter / X" },
              { key: "instagram_url", label: "Instagram" },
              { key: "facebook_url", label: "Facebook" },
              { key: "youtube_url", label: "YouTube" },
              { key: "telegram_url", label: "Telegram" },
              { key: "discord_url", label: "Discord" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <Switch
                  checked={socialLinks.visible_icons?.[key] !== false}
                  onCheckedChange={(v) => setSocialLinks(p => ({
                    ...p,
                    visible_icons: { ...p.visible_icons, [key]: v },
                  }))}
                />
                <div className="flex-1">
                  <Field label={`${label} URL`} value={(socialLinks as any)[key]} onChange={(v: string) => setSocialLinks(p => ({ ...p, [key]: v }))} placeholder={`https://${label.toLowerCase()}.com/...`} />
                </div>
              </div>
            ))}
            <SaveBtn onClick={() => save("social_links", socialLinks)} />
          </Card>
        </TabsContent>

        <TabsContent value="appstore">
          <Card className="p-6 space-y-4">
            <Field label="App Store Keywords" value={appStore.app_store_keywords} onChange={(v: string) => setAppStore(p => ({ ...p, app_store_keywords: v }))} textarea />
            <Field label="Short Description" value={appStore.short_description} onChange={(v: string) => setAppStore(p => ({ ...p, short_description: v }))} textarea />
            <Field label="Long Description" value={appStore.long_description} onChange={(v: string) => setAppStore(p => ({ ...p, long_description: v }))} textarea />
            <Field label="Promotional Text" value={appStore.promotional_text} onChange={(v: string) => setAppStore(p => ({ ...p, promotional_text: v }))} textarea />
            <Field label="App Store Support URL" value={appStore.app_store_support_url} onChange={(v: string) => setAppStore(p => ({ ...p, app_store_support_url: v }))} />
            <Field label="App Store Marketing URL" value={appStore.app_store_marketing_url} onChange={(v: string) => setAppStore(p => ({ ...p, app_store_marketing_url: v }))} />
            <SaveBtn onClick={() => save("app_store_settings", appStore)} />
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="p-6 space-y-4">
            <Field label="Google Analytics ID" value={analytics.google_analytics_id} onChange={(v: string) => setAnalytics(p => ({ ...p, google_analytics_id: v }))} placeholder="G-XXXXXXXXXX" />
            <Field label="Facebook Pixel ID" value={analytics.facebook_pixel_id} onChange={(v: string) => setAnalytics(p => ({ ...p, facebook_pixel_id: v }))} placeholder="123456789" />
            <p className="text-xs text-muted-foreground">Tracking scripts are automatically injected when IDs are provided.</p>
            <SaveBtn onClick={() => save("analytics_settings", analytics)} />
          </Card>
        </TabsContent>

        <TabsContent value="sitemap">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Search Engine Indexing</Label>
              <Switch checked={robots.indexing_enabled} onCheckedChange={(v) => setRobots(p => ({ ...p, indexing_enabled: v }))} />
            </div>
            <Field label="Custom Robots.txt Rules" value={robots.custom_rules} onChange={(v: string) => setRobots(p => ({ ...p, custom_rules: v }))} textarea placeholder="Disallow: /admin/" />
            <p className="text-xs text-muted-foreground">The sitemap.xml and robots.txt are generated dynamically based on these settings.</p>
            <SaveBtn onClick={() => save("robots_settings", robots)} />
          </Card>
        </TabsContent>

        <TabsContent value="indexnow">
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable IndexNow</Label>
              <Switch checked={indexnow.enabled} onCheckedChange={(v) => setIndexnow(p => ({ ...p, enabled: v }))} />
            </div>
            <Field label="IndexNow API Key" value={indexnow.api_key} onChange={(v: string) => setIndexnow(p => ({ ...p, api_key: v }))} placeholder="Your IndexNow API key" />
            <p className="text-xs text-muted-foreground">When enabled, search engines are pinged automatically when pages are created or updated.</p>
            <SaveBtn onClick={() => save("indexnow_settings", indexnow)} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

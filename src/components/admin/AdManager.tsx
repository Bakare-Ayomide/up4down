import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Eye, MousePointerClick, BarChart3, Image, Video, ExternalLink, X, Upload } from "lucide-react";

const ALL_PAGES = [
  { id: "home", label: "Home" },
  { id: "browse", label: "Browse" },
  { id: "download", label: "Download Detail" },
  { id: "news", label: "News" },
  { id: "account", label: "Account" },
  { id: "payment", label: "Payment" },
];

const POSITIONS = [
  { id: "top", label: "Top Banner" },
  { id: "sidebar", label: "Sidebar" },
  { id: "bottom", label: "Bottom Banner" },
  { id: "inline", label: "Inline (between content)" },
];

interface Ad {
  id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  media_type: string;
  ad_url: string;
  redirect_url: string | null;
  pages: string[];
  position: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
  created_at: string;
}

export const AdManager = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ad | null>(null);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [adUrl, setAdUrl] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [pages, setPages] = useState<string[]>([]);
  const [position, setPosition] = useState("sidebar");

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    const { data } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
    if (data) setAds(data as any);
    setLoading(false);
  };

  const fetchAdEvents = async (adId: string) => {
    const { data } = await supabase
      .from("ad_events")
      .select("*")
      .eq("ad_id", adId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setEvents(data);
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setMediaUrl(""); setMediaType("image");
    setAdUrl(""); setRedirectUrl(""); setPages([]); setPosition("sidebar");
    setEditing(null); setShowForm(false);
  };

  const startEdit = (ad: Ad) => {
    setEditing(ad);
    setTitle(ad.title);
    setDescription(ad.description || "");
    setMediaUrl(ad.media_url || "");
    setMediaType(ad.media_type);
    setAdUrl(ad.ad_url);
    setRedirectUrl(ad.redirect_url || "");
    setPages(ad.pages || []);
    setPosition(ad.position);
    setShowForm(true);
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("ad-media").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("ad-media").getPublicUrl(path);
    setMediaUrl(urlData.publicUrl);
    if (file.type.startsWith("video")) setMediaType("video");
    else setMediaType("image");
    setUploading(false);
    toast.success("Media uploaded!");
  };

  const handleSave = async () => {
    if (!title || !adUrl) { toast.error("Title and Ad URL are required"); return; }
    const payload = {
      title, description: description || null, media_url: mediaUrl || null,
      media_type: mediaType, ad_url: adUrl, redirect_url: redirectUrl || null,
      pages, position,
    };
    if (editing) {
      const { error } = await supabase.from("ads").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Ad updated!");
    } else {
      const { error } = await supabase.from("ads").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Ad created!");
    }
    resetForm();
    fetchAds();
  };

  const toggleActive = async (ad: Ad) => {
    await supabase.from("ads").update({ is_active: !ad.is_active }).eq("id", ad.id);
    fetchAds();
  };

  const deleteAd = async (id: string) => {
    if (!confirm("Delete this ad?")) return;
    await supabase.from("ads").delete().eq("id", id);
    toast.success("Ad deleted");
    fetchAds();
    if (selectedAd?.id === id) setSelectedAd(null);
  };

  const viewStats = (ad: Ad) => {
    setSelectedAd(ad);
    fetchAdEvents(ad.id);
  };

  const togglePage = (pageId: string) => {
    setPages(prev => prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]);
  };

  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";

  if (selectedAd) {
    const adCtr = selectedAd.impressions > 0 ? ((selectedAd.clicks / selectedAd.impressions) * 100).toFixed(2) : "0";
    const todayEvents = events.filter(e => new Date(e.created_at).toDateString() === new Date().toDateString());
    const todayImpressions = todayEvents.filter(e => e.event_type === "impression").length;
    const todayClicks = todayEvents.filter(e => e.event_type === "click").length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Ad Statistics</h2>
            <p className="text-muted-foreground">{selectedAd.title}</p>
          </div>
          <Button variant="outline" onClick={() => setSelectedAd(null)}>← Back</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Impressions", value: selectedAd.impressions, icon: Eye },
            { label: "Total Clicks", value: selectedAd.clicks, icon: MousePointerClick },
            { label: "CTR", value: `${adCtr}%`, icon: BarChart3 },
            { label: "Today Clicks", value: todayClicks, icon: MousePointerClick },
          ].map((s, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <s.icon className="h-4 w-4" /> {s.label}
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <h3 className="font-semibold mb-3">Today's Activity</h3>
          <p className="text-sm text-muted-foreground mb-2">{todayImpressions} impressions, {todayClicks} clicks today</p>
          <h3 className="font-semibold mb-3 mt-4">Recent Events (last 100)</h3>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {events.length === 0 && <p className="text-sm text-muted-foreground">No events recorded yet</p>}
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between text-sm py-1 border-b border-border">
                <Badge variant={ev.event_type === "click" ? "default" : "secondary"}>{ev.event_type}</Badge>
                <span className="text-muted-foreground">{ev.page || "—"}</span>
                <span className="text-muted-foreground text-xs">
                  {new Date(ev.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {selectedAd.media_url && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Preview</h3>
            {selectedAd.media_type === "video" ? (
              <video src={selectedAd.media_url} controls className="max-h-48 rounded-lg" />
            ) : (
              <img src={selectedAd.media_url} alt={selectedAd.title} className="max-h-48 rounded-lg object-contain" />
            )}
          </Card>
        )}
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{editing ? "Edit Ad" : "Create Ad"}</h2>
          <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-5 w-5" /></Button>
        </div>

        <Card className="p-6 space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Ad Title *</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Summer Sale Banner" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Ad Description</label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..." rows={2} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Media (Banner/Photo/Video)</label>
            <div className="flex gap-2">
              <Input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="Paste URL or upload..." className="flex-1" />
              <label className="cursor-pointer">
                <Button variant="outline" className="gap-2" asChild disabled={uploading}>
                  <span><Upload className="h-4 w-4" />{uploading ? "..." : "Upload"}</span>
                </Button>
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
              </label>
            </div>
            {mediaUrl && (
              <div className="mt-2">
                {mediaType === "video" ? (
                  <video src={mediaUrl} controls className="max-h-32 rounded-lg" />
                ) : (
                  <img src={mediaUrl} alt="preview" className="max-h-32 rounded-lg object-contain" />
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Media Type</label>
              <Select value={mediaType} onValueChange={setMediaType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="banner">Banner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Position</label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POSITIONS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Ad URL (where ad links to) *</label>
            <Input value={adUrl} onChange={e => setAdUrl(e.target.value)} placeholder="https://example.com/product" />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Redirect URL (optional fallback)</label>
            <Input value={redirectUrl} onChange={e => setRedirectUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Show on Pages</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ALL_PAGES.map(page => (
                <label key={page.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={pages.includes(page.id)} onCheckedChange={() => togglePage(page.id)} />
                  <span className="text-sm">{page.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="flex-1">{editing ? "Update Ad" : "Create Ad"}</Button>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ad Manager</h2>
          <p className="text-muted-foreground">Create and manage your DIY ads with real-time stats</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Create Ad
        </Button>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <Eye className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <div className="text-2xl font-bold">{totalImpressions}</div>
          <div className="text-xs text-muted-foreground">Total Impressions</div>
        </Card>
        <Card className="p-4 text-center">
          <MousePointerClick className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <div className="text-2xl font-bold">{totalClicks}</div>
          <div className="text-xs text-muted-foreground">Total Clicks</div>
        </Card>
        <Card className="p-4 text-center">
          <BarChart3 className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <div className="text-2xl font-bold">{ctr}%</div>
          <div className="text-xs text-muted-foreground">Avg CTR</div>
        </Card>
      </div>

      {/* Ad list */}
      {loading ? (
        <p className="text-muted-foreground text-center py-12">Loading ads...</p>
      ) : ads.length === 0 ? (
        <Card className="p-12 text-center">
          <Image className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">No ads yet</h3>
          <p className="text-muted-foreground mb-4">Create your first ad to start monetizing</p>
          <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" /> Create Ad</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {ads.map(ad => (
            <Card key={ad.id} className="p-4">
              <div className="flex items-center gap-4">
                {ad.media_url ? (
                  ad.media_type === "video" ? (
                    <div className="h-16 w-24 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Video className="h-6 w-6 text-muted-foreground" />
                    </div>
                  ) : (
                    <img src={ad.media_url} alt={ad.title} className="h-16 w-24 rounded-lg object-cover shrink-0" />
                  )
                ) : (
                  <div className="h-16 w-24 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{ad.title}</h3>
                    <Badge variant={ad.is_active ? "default" : "secondary"} className="shrink-0">
                      {ad.is_active ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-1">
                    {ad.pages?.map(p => (
                      <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                    ))}
                    <Badge variant="outline" className="text-xs">{ad.position}</Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{ad.impressions}</span>
                    <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{ad.clicks}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={ad.is_active} onCheckedChange={() => toggleActive(ad)} />
                  <Button variant="ghost" size="icon" onClick={() => viewStats(ad)}><BarChart3 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(ad)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteAd(ad.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

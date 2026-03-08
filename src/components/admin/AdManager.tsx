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
import { Plus, Trash2, Edit2, Eye, MousePointerClick, BarChart3, Image, Video, X, Upload, FileDown, Globe, Monitor, Smartphone, Tablet } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const ALL_PAGES = [
  { id: "home", label: "Home" },
  { id: "browse", label: "Browse" },
  { id: "download", label: "Download Detail" },
  { id: "news", label: "News" },
  { id: "account", label: "Account" },
  { id: "payment", label: "Payment" },
  { id: "support", label: "Support" },
  { id: "waitlist", label: "Waitlist" },
];

const POSITIONS = [
  { id: "top", label: "Top Banner" },
  { id: "sidebar", label: "Sidebar" },
  { id: "inline", label: "Inline (between sections)" },
  { id: "bottom", label: "Bottom Banner" },
  { id: "after-header", label: "After Page Header" },
  { id: "before-footer", label: "Before Footer" },
  { id: "after-hero", label: "After Hero (Home)" },
  { id: "after-features", label: "After Features (Home)" },
  { id: "after-categories", label: "After Categories (Home)" },
  { id: "before-listing", label: "Before Listing (Browse)" },
  { id: "after-listing", label: "After Listing (Browse)" },
  { id: "after-description", label: "After Description (Download)" },
  { id: "after-rating", label: "After Rating (Download)" },
  { id: "before-faq", label: "Before FAQ (Support)" },
  { id: "after-faq", label: "After FAQ (Support)" },
];

const AD_SIZES = [
  { id: "small", label: "Small (64px height)", previewH: 64 },
  { id: "medium", label: "Medium (160px height)", previewH: 160 },
  { id: "large", label: "Large (240px height)", previewH: 240 },
  { id: "full-width", label: "Full Width (192px height)", previewH: 192 },
  { id: "custom", label: "Custom Size", previewH: 160 },
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
  ad_size: string;
  custom_width: number | null;
  custom_height: number | null;
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
  const [positions, setPositions] = useState<string[]>(["sidebar"]);
  const [adSize, setAdSize] = useState("medium");
  const [customWidth, setCustomWidth] = useState<number>(320);
  const [customHeight, setCustomHeight] = useState<number>(160);

  useEffect(() => { fetchAds(); }, []);

  const fetchAds = async () => {
    const { data } = await supabase.from("ads").select("*").order("created_at", { ascending: false });
    if (data) setAds(data as any);
    setLoading(false);
  };

  const fetchAdEvents = async (adId?: string) => {
    let query = supabase.from("ad_events").select("*").order("created_at", { ascending: false }).limit(500);
    if (adId) query = query.eq("ad_id", adId);
    const { data } = await query;
    const rows = (data || []) as any[];
    setEvents(rows);
    return rows;
  };

  const resetForm = () => {
    setTitle(""); setDescription(""); setMediaUrl(""); setMediaType("image");
    setAdUrl(""); setRedirectUrl(""); setPages([]); setPositions(["sidebar"]);
    setAdSize("medium"); setCustomWidth(320); setCustomHeight(160);
    setEditing(null); setShowForm(false);
  };

  const startEdit = (ad: Ad) => {
    setEditing(ad); setTitle(ad.title); setDescription(ad.description || "");
    setMediaUrl(ad.media_url || ""); setMediaType(ad.media_type);
    setAdUrl(ad.ad_url); setRedirectUrl(ad.redirect_url || "");
    setPages(ad.pages || []); setPositions(ad.position ? ad.position.split(",") : ["sidebar"]);
    setAdSize(ad.ad_size || "medium");
    setCustomWidth(ad.custom_width || 320); setCustomHeight(ad.custom_height || 160);
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
    if (pages.length === 0) { toast.error("Select at least one page"); return; }
    if (positions.length === 0) { toast.error("Select at least one position"); return; }

    const payload = {
      title, description: description || null, media_url: mediaUrl || null,
      media_type: mediaType, ad_url: adUrl, redirect_url: redirectUrl || null,
      pages, ad_size: adSize,
      custom_width: adSize === "custom" ? customWidth : null,
      custom_height: adSize === "custom" ? customHeight : null,
    };

    // Store all positions as comma-separated in the position column (single row)
    const positionValue = positions.join(",");

    if (editing) {
      const { error } = await supabase
        .from("ads")
        .update({ ...payload, position: positionValue })
        .eq("id", editing.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Ad updated!");
    } else {
      const { error } = await supabase.from("ads").insert({ ...payload, position: positionValue });
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
    toast.success("Ad deleted"); fetchAds();
    if (selectedAd?.id === id) setSelectedAd(null);
  };

  const viewStats = (ad: Ad) => { setSelectedAd(ad); fetchAdEvents(ad.id); };
  const togglePage = (pageId: string) => {
    setPages(prev => prev.includes(pageId) ? prev.filter(p => p !== pageId) : [...prev, pageId]);
  };
  const togglePosition = (positionId: string) => {
    setPositions((prev) => prev.includes(positionId)
      ? prev.filter((p) => p !== positionId)
      : [...prev, positionId]);
  };

  // Aggregate helpers
  const groupBy = (arr: any[], key: string) => {
    const map: Record<string, number> = {};
    arr.forEach(e => { const v = e[key] || "Unknown"; map[v] = (map[v] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  };

  // PDF Generation
  const generatePdf = (ad?: Ad, sourceEvents?: any[]) => {
    try {
      const doc = new jsPDF();
      const isOverall = !ad;
      const reportEvents = sourceEvents ?? events;
      const title = isOverall ? "Overall Ad Performance Report" : `Ad Report: ${ad.title}`;
      const relevantEvents = isOverall ? reportEvents : reportEvents.filter(e => e.ad_id === ad?.id);
      const impressions = relevantEvents.filter(e => e.event_type === "impression").length;
      const clicks = relevantEvents.filter(e => e.event_type === "click").length;
      const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0";

      // Header
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, 210, 35, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22); doc.setFont("helvetica", "bold");
      doc.text("ZEROLORD", 14, 18);
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.text("Ad Performance Report", 14, 27);
      doc.text(new Date().toLocaleDateString(), 170, 27);

      // Title
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16); doc.setFont("helvetica", "bold");
      doc.text(title, 14, 48);

      // Summary stats
      doc.setFontSize(11); doc.setFont("helvetica", "normal");
      let y = 58;
      doc.text(`Total Impressions: ${isOverall ? ads.reduce((s, a) => s + a.impressions, 0) : impressions}`, 14, y); y += 7;
      doc.text(`Total Clicks: ${isOverall ? ads.reduce((s, a) => s + a.clicks, 0) : clicks}`, 14, y); y += 7;
      doc.text(`CTR: ${ctr}%`, 14, y); y += 7;
      doc.text(`Events Analyzed: ${relevantEvents.length}`, 14, y); y += 12;

      if (!isOverall && ad) {
        doc.text(`URL: ${ad.ad_url}`, 14, y); y += 7;
        doc.text(`Position: ${ad.position}`, 14, y); y += 7;
        doc.text(`Pages: ${ad.pages?.join(", ") || "None"}`, 14, y); y += 12;
      }

      // Demographics tables
      const addTable = (heading: string, data: [string, number][], startY: number) => {
        doc.setFontSize(12); doc.setFont("helvetica", "bold");
        doc.text(heading, 14, startY);
        autoTable(doc, {
          startY: startY + 3,
          head: [["Value", "Count", "%"]],
          body: data.map(([v, c]) => [v, c, relevantEvents.length > 0 ? ((c / relevantEvents.length) * 100).toFixed(1) + "%" : "0%"]),
          theme: "striped",
          headStyles: { fillColor: [220, 38, 38] },
          margin: { left: 14, right: 14 },
        });
        return ((doc as any).lastAutoTable?.finalY || startY) + 10;
      };

      y = addTable("Countries", groupBy(relevantEvents, "country"), y);
      y = addTable("Browsers", groupBy(relevantEvents, "browser"), y);

      if (y > 240) { doc.addPage(); y = 20; }
      y = addTable("Devices", groupBy(relevantEvents, "device_type"), y);
      y = addTable("Operating Systems", groupBy(relevantEvents, "os"), y);

      if (y > 240) { doc.addPage(); y = 20; }
      y = addTable("Screen Resolutions", groupBy(relevantEvents, "screen_resolution"), y);
      y = addTable("Pages", groupBy(relevantEvents, "page"), y);

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(128, 128, 128);
        doc.text(`Generated by Zerolord Ad Manager — Page ${i}/${pageCount}`, 14, 290);
      }

      doc.save(`${isOverall ? "overall" : ad!.title.replace(/\s+/g, "-")}-ad-report.pdf`);
      toast.success("PDF downloaded!");
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  // === STATS VIEW ===
  if (selectedAd) {
    const adCtr = selectedAd.impressions > 0 ? ((selectedAd.clicks / selectedAd.impressions) * 100).toFixed(2) : "0";
    const todayEvents = events.filter(e => new Date(e.created_at).toDateString() === new Date().toDateString());
    const countries = groupBy(events, "country");
    const browsers = groupBy(events, "browser");
    const devices = groupBy(events, "device_type");
    const oses = groupBy(events, "os");

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Ad Statistics</h2>
            <p className="text-muted-foreground">{selectedAd.title}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => generatePdf(selectedAd)} className="gap-2">
              <FileDown className="h-4 w-4" /> Download PDF
            </Button>
            <Button variant="outline" onClick={() => setSelectedAd(null)}>← Back</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Impressions", value: selectedAd.impressions, icon: Eye },
            { label: "Total Clicks", value: selectedAd.clicks, icon: MousePointerClick },
            { label: "CTR", value: `${adCtr}%`, icon: BarChart3 },
            { label: "Today Events", value: todayEvents.length, icon: BarChart3 },
          ].map((s, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                <s.icon className="h-4 w-4" /> {s.label}
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </Card>
          ))}
        </div>

        {/* Demographics */}
        <div className="grid md:grid-cols-2 gap-4">
          <DemoCard title="Countries" icon={<Globe className="h-4 w-4" />} data={countries} />
          <DemoCard title="Browsers" icon={<Monitor className="h-4 w-4" />} data={browsers} />
          <DemoCard title="Device Types" icon={<Smartphone className="h-4 w-4" />} data={devices} />
          <DemoCard title="Operating Systems" icon={<Tablet className="h-4 w-4" />} data={oses} />
        </div>

        {/* Recent Events */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Recent Events (last 500)</h3>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {events.length === 0 && <p className="text-sm text-muted-foreground">No events recorded yet</p>}
            {events.slice(0, 100).map((ev) => (
              <div key={ev.id} className="flex items-center justify-between text-xs py-1.5 border-b border-border gap-2 flex-wrap">
                <Badge variant={ev.event_type === "click" ? "default" : "secondary"} className="shrink-0">{ev.event_type}</Badge>
                <span className="text-muted-foreground">{ev.page || "—"}</span>
                <span className="text-muted-foreground">{ev.country || "—"}</span>
                <span className="text-muted-foreground">{ev.browser || "—"}</span>
                <span className="text-muted-foreground">{ev.device_type || "—"}</span>
                <span className="text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</span>
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

  // === FORM VIEW ===
  if (showForm) {
    const sizeInfo = AD_SIZES.find(s => s.id === adSize);
    const previewH = adSize === "custom" ? customHeight : (sizeInfo?.previewH || 160);
    const previewW = adSize === "custom" ? customWidth : undefined;

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

          <div>
            <label className="text-sm font-medium mb-2 block">Positions / Sections</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto rounded-md border border-border p-3">
              {POSITIONS.map((item) => (
                <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={positions.includes(item.id)} onCheckedChange={() => togglePosition(item.id)} />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Ad Size */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Ad Size</label>
            <Select value={adSize} onValueChange={setAdSize}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AD_SIZES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {adSize === "custom" && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="text-xs text-muted-foreground">Width (px)</label>
                  <Input type="number" value={customWidth} onChange={e => setCustomWidth(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Height (px)</label>
                  <Input type="number" value={customHeight} onChange={e => setCustomHeight(Number(e.target.value))} />
                </div>
              </div>
            )}
          </div>

          {/* Size Preview */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Size Preview</label>
            <div
              className="border-2 border-dashed border-primary/30 rounded-xl bg-muted/30 flex items-center justify-center text-muted-foreground text-sm"
              style={{ height: Math.min(previewH, 200), width: previewW ? Math.min(previewW, 500) : "100%" }}
            >
              {mediaUrl ? (
                <img src={mediaUrl} alt="preview" className="w-full h-full object-cover rounded-lg" />
              ) : (
                `${previewW || "Full Width"} × ${previewH}px`
              )}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

  // === LIST VIEW ===
  const totalImpressions = ads.reduce((s, a) => s + a.impressions, 0);
  const totalClicks = ads.reduce((s, a) => s + a.clicks, 0);
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";

  const handleOverallPdf = async () => {
    const reportEvents = await fetchAdEvents();
    generatePdf(undefined, reportEvents);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Ad Manager</h2>
          <p className="text-muted-foreground">Create and manage your DIY ads with real-time stats</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOverallPdf} className="gap-2">
            <FileDown className="h-4 w-4" /> Overall PDF
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Create Ad
          </Button>
        </div>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
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
                    {ad.pages?.map(p => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}
                    {ad.position?.split(",").map(pos => (
                      <Badge key={pos} variant="outline" className="text-xs">{POSITIONS.find(p => p.id === pos)?.label || pos}</Badge>
                    ))}
                    <Badge variant="outline" className="text-xs">{ad.ad_size}</Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{ad.impressions}</span>
                    <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{ad.clicks}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
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

// Demographics card component
const DemoCard = ({ title, icon, data }: { title: string; icon: React.ReactNode; data: [string, number][] }) => (
  <Card className="p-4">
    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">{icon} {title}</h3>
    {data.length === 0 ? (
      <p className="text-xs text-muted-foreground">No data yet</p>
    ) : (
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {data.slice(0, 10).map(([name, count]) => (
          <div key={name} className="flex items-center justify-between text-sm">
            <span className="truncate">{name}</span>
            <Badge variant="secondary" className="shrink-0">{count}</Badge>
          </div>
        ))}
      </div>
    )}
  </Card>
);

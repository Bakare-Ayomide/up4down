import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X, Eye, Code2 } from "lucide-react";

const AD_TYPES = [
  { id: "banner", label: "Banner" },
  { id: "pop", label: "Pop-under / Pop-up" },
  { id: "interstitial", label: "Interstitial" },
  { id: "native", label: "Native Banner" },
  { id: "social-bar", label: "Social Bar" },
  { id: "direct-link", label: "Direct Link" },
  { id: "other", label: "Other" },
];

const PLACEMENTS = [
  { id: "global", label: "Global (all pages)" },
  { id: "header", label: "Header" },
  { id: "footer", label: "Footer" },
  { id: "sidebar", label: "Sidebar" },
  { id: "before-content", label: "Before Content" },
  { id: "after-content", label: "After Content" },
  { id: "download-page", label: "Download Page" },
  { id: "browse-page", label: "Browse Page" },
  { id: "home-page", label: "Home Page" },
  { id: "inline", label: "Inline" },
];

interface AdSnippet {
  id: string;
  name: string;
  ad_type: string;
  snippet: string;
  placement: string;
  status: string;
  preview_notes: string | null;
  created_at: string;
}

export const AdSnippetManager = () => {
  const [snippets, setSnippets] = useState<AdSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdSnippet | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [adType, setAdType] = useState("banner");
  const [snippet, setSnippet] = useState("");
  const [placement, setPlacement] = useState("global");
  const [previewNotes, setPreviewNotes] = useState("");

  useEffect(() => { fetchSnippets(); }, []);

  const fetchSnippets = async () => {
    const { data } = await supabase
      .from("ad_snippets")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSnippets(data as any);
    setLoading(false);
  };

  const resetForm = () => {
    setName(""); setAdType("banner"); setSnippet(""); setPlacement("global"); setPreviewNotes("");
    setEditing(null); setShowForm(false);
  };

  const startEdit = (s: AdSnippet) => {
    setEditing(s); setName(s.name); setAdType(s.ad_type); setSnippet(s.snippet);
    setPlacement(s.placement); setPreviewNotes(s.preview_notes || "");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name || !snippet) { toast.error("Name and snippet code are required"); return; }

    const payload = { name, ad_type: adType, snippet, placement, preview_notes: previewNotes || null };

    if (editing) {
      const { error } = await supabase.from("ad_snippets").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Ad snippet updated!");
    } else {
      const { error } = await supabase.from("ad_snippets").insert(payload);
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Ad snippet created!");
    }
    resetForm(); fetchSnippets();
  };

  const toggleStatus = async (s: AdSnippet) => {
    const newStatus = s.status === "active" ? "inactive" : "active";
    await supabase.from("ad_snippets").update({ status: newStatus }).eq("id", s.id);
    fetchSnippets();
  };

  const deleteSnippet = async (id: string) => {
    if (!confirm("Delete this ad snippet?")) return;
    await supabase.from("ad_snippets").delete().eq("id", id);
    toast.success("Snippet deleted"); fetchSnippets();
  };

  // === FORM VIEW ===
  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{editing ? "Edit Ad Snippet" : "Add Ad Snippet"}</h2>
          <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-5 w-5" /></Button>
        </div>

        <Card className="p-6 space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Name / Title *</label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Adsterra Banner 300x250" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ad Type</label>
              <Select value={adType} onValueChange={setAdType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AD_TYPES.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Placement</label>
              <Select value={placement} onValueChange={setPlacement}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLACEMENTS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Ad Code Snippet (raw HTML/JS) *</label>
            <Textarea
              value={snippet}
              onChange={e => setSnippet(e.target.value)}
              placeholder={'Paste your Adsterra / AdSense / any ad platform code here...\n<script>...</script>'}
              rows={10}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground mt-1">Paste the exact code provided by your ad network. It will be rendered as-is.</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Notes (optional)</label>
            <Input value={previewNotes} onChange={e => setPreviewNotes(e.target.value)} placeholder="e.g. 300x250 sidebar banner for US traffic" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} className="flex-1">{editing ? "Update Snippet" : "Add Snippet"}</Button>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </Card>
      </div>
    );
  }

  // === LIST VIEW ===
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold">Ad Snippets (External Platforms)</h2>
          <p className="text-muted-foreground">Manage Adsterra, AdSense, and other ad platform code snippets</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Snippet
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-12">Loading...</p>
      ) : snippets.length === 0 ? (
        <Card className="p-12 text-center">
          <Code2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg mb-2">No ad snippets yet</h3>
          <p className="text-muted-foreground mb-4">Paste your ad platform code to manage it here</p>
          <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" /> Add Snippet</Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {snippets.map(s => (
            <Card key={s.id} className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Code2 className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{s.name}</h3>
                    <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">{AD_TYPES.find(t => t.id === s.ad_type)?.label || s.ad_type}</Badge>
                    <Badge variant="outline" className="text-xs">{PLACEMENTS.find(p => p.id === s.placement)?.label || s.placement}</Badge>
                  </div>
                  {s.preview_notes && <p className="text-xs text-muted-foreground mt-1 truncate">{s.preview_notes}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={s.status === "active"} onCheckedChange={() => toggleStatus(s)} />
                  <Button variant="ghost" size="icon" onClick={() => setPreviewId(previewId === s.id ? null : s.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(s)}><Edit2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteSnippet(s.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>

              {previewId === s.id && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Code Preview:</p>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">{s.snippet}</pre>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

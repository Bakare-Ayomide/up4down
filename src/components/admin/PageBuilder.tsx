import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Loader2, ArrowUp, ArrowDown, Edit2, Eye, ExternalLink, FileText, GripVertical } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PageBlock {
  id: string;
  type: "heading" | "text" | "image" | "button" | "divider" | "html";
  content: string;
  props?: Record<string, any>;
}

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: PageBlock[];
  published: boolean;
  created_at: string;
}

const BLOCK_TYPES = [
  { value: "heading", label: "Heading" },
  { value: "text", label: "Text Paragraph" },
  { value: "image", label: "Image" },
  { value: "button", label: "Button" },
  { value: "divider", label: "Divider" },
  { value: "html", label: "Raw HTML" },
];

export const PageBuilder = () => {
  const [pages, setPages] = useState<CustomPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CustomPage | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [published, setPublished] = useState(false);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);

  useEffect(() => { fetchPages(); }, []);

  const fetchPages = async () => {
    const { data } = await supabase.from("custom_pages").select("*").order("created_at", { ascending: false });
    if (data) setPages(data as any);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(""); setSlug(""); setPublished(false); setBlocks([]);
    setEditing(null);
  };

  const startEdit = (page: CustomPage) => {
    setEditing(page);
    setTitle(page.title);
    setSlug(page.slug);
    setPublished(page.published);
    setBlocks(Array.isArray(page.content) ? page.content : []);
  };

  const addBlock = (type: string) => {
    setBlocks([...blocks, { id: crypto.randomUUID(), type: type as any, content: "", props: {} }]);
  };

  const updateBlock = (id: string, updates: Partial<PageBlock>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const newBlocks = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= newBlocks.length) return;
    [newBlocks[index], newBlocks[target]] = [newBlocks[target], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const handleSave = async () => {
    if (!title || !slug) { toast.error("Title and slug are required"); return; }
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "");
    setSaving(true);

    if (editing) {
      const { error } = await supabase.from("custom_pages").update({
        title, slug: cleanSlug, published, content: blocks as any,
      }).eq("id", editing.id);
      if (error) toast.error(error.message);
      else { toast.success("Page updated!"); resetForm(); fetchPages(); }
    } else {
      const { error } = await supabase.from("custom_pages").insert({
        title, slug: cleanSlug, published, content: blocks as any,
      });
      if (error) toast.error(error.message);
      else { toast.success("Page created!"); resetForm(); fetchPages(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("custom_pages").delete().eq("id", deleteId);
    toast.success("Page deleted");
    setDeleteId(null);
    fetchPages();
  };

  const autoSlug = (t: string) => {
    if (!editing) setSlug(t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  };

  // Show form
  if (editing !== null || title || blocks.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{editing ? "Edit Page" : "Create New Page"}</h2>
          <Button variant="outline" onClick={resetForm}>Cancel</Button>
        </div>

        <Card className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Page Title *</Label>
              <Input value={title} onChange={(e) => { setTitle(e.target.value); autoSlug(e.target.value); }} placeholder="About Us" className="mt-1" />
            </div>
            <div>
              <Label>URL Slug *</Label>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm text-muted-foreground">/page/</span>
                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="about-us" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={published} onCheckedChange={setPublished} />
            <Label>Published</Label>
          </div>
        </Card>

        {/* Blocks */}
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <Card key={block.id} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary" className="text-xs">{block.type}</Badge>
                <div className="flex-1" />
                <Button size="icon" variant="ghost" onClick={() => moveBlock(index, -1)} disabled={index === 0}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => removeBlock(block.id)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>

              {block.type === "divider" ? (
                <hr className="border-border" />
              ) : block.type === "image" ? (
                <div className="space-y-2">
                  <Input value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} placeholder="Image URL" />
                  <Input value={block.props?.alt || ""} onChange={(e) => updateBlock(block.id, { props: { ...block.props, alt: e.target.value } })} placeholder="Alt text" />
                </div>
              ) : block.type === "button" ? (
                <div className="grid sm:grid-cols-2 gap-2">
                  <Input value={block.content} onChange={(e) => updateBlock(block.id, { content: e.target.value })} placeholder="Button text" />
                  <Input value={block.props?.url || ""} onChange={(e) => updateBlock(block.id, { props: { ...block.props, url: e.target.value } })} placeholder="Button URL" />
                </div>
              ) : (
                <Textarea
                  value={block.content}
                  onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                  placeholder={block.type === "heading" ? "Heading text..." : block.type === "html" ? "<div>Your HTML...</div>" : "Write your content..."}
                  rows={block.type === "html" ? 6 : 3}
                />
              )}
            </Card>
          ))}
        </div>

        {/* Add block */}
        <div className="flex flex-wrap gap-2">
          {BLOCK_TYPES.map((bt) => (
            <Button key={bt.value} variant="outline" size="sm" onClick={() => addBlock(bt.value)} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> {bt.label}
            </Button>
          ))}
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2 w-full sm:w-auto">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editing ? "Update Page" : "Create Page"}
        </Button>
      </div>
    );
  }

  // Page list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Page Builder</h2>
          <p className="text-muted-foreground">Create and manage custom pages</p>
        </div>
        <Button onClick={() => setTitle(" ")} className="gap-2">
          <Plus className="h-4 w-4" /> New Page
        </Button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid gap-3">
          {pages.map((page) => (
            <Card key={page.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{page.title}</h3>
                    <p className="text-xs text-muted-foreground">/page/{page.slug}</p>
                  </div>
                  <Badge variant={page.published ? "default" : "secondary"}>
                    {page.published ? "Live" : "Draft"}
                  </Badge>
                </div>
                <div className="flex gap-2 shrink-0">
                  {page.published && (
                    <Button size="sm" variant="ghost" asChild>
                      <a href={`/page/${page.slug}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => startEdit(page)} className="gap-1">
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(page.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {pages.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No pages yet. Click "New Page" to create one.
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this page?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
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

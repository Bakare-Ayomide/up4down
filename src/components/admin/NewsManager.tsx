import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Loader2, Edit2, Newspaper, Bold, Italic, Heading1, Heading2, List, Link as LinkIcon, Image, Code } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export const NewsManager = () => {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [published, setPublished] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = async () => {
    const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false });
    if (data) setItems(data as any);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(""); setContent(""); setExcerpt(""); setPublished(false);
    setEditing(null); setShowForm(false);
  };

  const startEdit = (item: NewsItem) => {
    setEditing(item);
    setTitle(item.title);
    setContent(item.content);
    setExcerpt(item.excerpt || "");
    setPublished(item.published);
    setShowForm(true);
  };

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    const textarea = document.getElementById("news-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const newContent = content.substring(0, start) + prefix + selected + suffix + content.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleSave = async () => {
    if (!title) { toast.error("Title is required"); return; }
    setSaving(true);

    if (editing) {
      const { error } = await supabase.from("news").update({
        title, content, excerpt: excerpt || null, published,
      }).eq("id", editing.id);
      if (error) toast.error(error.message);
      else { toast.success("News updated!"); resetForm(); fetchNews(); }
    } else {
      const { error } = await supabase.from("news").insert({
        title, content, excerpt: excerpt || null, published,
      });
      if (error) toast.error(error.message);
      else { toast.success("News created!"); resetForm(); fetchNews(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from("news").delete().eq("id", deleteId);
    toast.success("News deleted");
    setDeleteId(null);
    fetchNews();
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{editing ? "Edit News" : "Create News Article"}</h2>
          <Button variant="outline" onClick={resetForm}>Cancel</Button>
        </div>

        <Card className="p-6 space-y-4">
          <div>
            <Label>Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Article title" className="mt-1" />
          </div>
          <div>
            <Label>Excerpt (short preview)</Label>
            <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Brief summary..." className="mt-1" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={published} onCheckedChange={setPublished} />
            <Label>Published</Label>
          </div>
        </Card>

        {/* Rich Editor Toolbar */}
        <Card className="p-3">
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("**", "**")} title="Bold">
              <Bold className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("*", "*")} title="Italic">
              <Italic className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("# ")} title="Heading 1">
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("## ")} title="Heading 2">
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("- ")} title="List">
              <List className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("[", "](url)")} title="Link">
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("![alt](", ")")} title="Image">
              <Image className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("`", "`")} title="Code">
              <Code className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("```\n", "\n```")} title="Code Block">
              <span className="text-xs font-mono">{"{ }"}</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("---\n")} title="Divider">
              <span className="text-xs">—</span>
            </Button>
          </div>
        </Card>

        {/* Content Editor */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">Content (Markdown)</Label>
            <Textarea
              id="news-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your news article here using Markdown..."
              rows={20}
              className="font-mono text-sm"
            />
          </div>
          <div>
            <Label className="mb-2 block">Preview</Label>
            <Card className="p-4 prose prose-sm dark:prose-invert max-w-none min-h-[300px] overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
            </Card>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {editing ? "Update News" : "Publish News"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">News Manager</h2>
          <p className="text-muted-foreground">Create and manage news articles</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Article
        </Button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid gap-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <Newspaper className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={item.published ? "default" : "secondary"}>
                    {item.published ? "Live" : "Draft"}
                  </Badge>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => startEdit(item)} className="gap-1">
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(item.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {items.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No news articles yet. Click "New Article" to create one.
            </div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this article?</AlertDialogTitle>
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

// Simple markdown to HTML converter
function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px" />');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-primary underline">$1</a>');
  // Horizontal rule
  html = html.replace(/^---$/gm, "<hr />");
  // List items
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  // Wrap consecutive li in ul
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
  // Paragraphs
  html = html.replace(/^(?!<[huploi]|<\/|<hr|<pre|<code)(.+)$/gm, "<p>$1</p>");

  return html;
}

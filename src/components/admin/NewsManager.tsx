import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, Loader2, Edit2, Newspaper, Bold, Italic, Heading1, Heading2, List, Link as LinkIcon, Image, Code, Upload, FileUp, Video } from "lucide-react";
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
  thumbnail_url: string | null;
  file_urls: any;
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
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [published, setPublished] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchNews(); }, []);

  const fetchNews = async () => {
    const { data } = await supabase.from("news").select("*").order("created_at", { ascending: false });
    if (data) setItems(data as any);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle(""); setContent(""); setExcerpt(""); setThumbnailUrl(""); setPublished(false);
    setEditing(null); setShowForm(false);
  };

  const startEdit = (item: NewsItem) => {
    setEditing(item);
    setTitle(item.title);
    setContent(item.content);
    setExcerpt(item.excerpt || "");
    setThumbnailUrl(item.thumbnail_url || "");
    setPublished(item.published);
    setShowForm(true);
  };

  const uploadFile = async (file: File, bucket: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `news/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) { toast.error(`Upload failed: ${error.message}`); return null; }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, "thumbnails");
    if (url) setThumbnailUrl(url);
    setUploading(false);
  };

  const handleFileInsert = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadFile(file, "thumbnails");
    if (url) {
      // Insert as markdown link or image
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (isImage) {
        insertAtCursor(`![${file.name}](${url})`);
      } else if (isVideo) {
        insertAtCursor(`<video src="${url}" controls style="max-width:100%;border-radius:8px"></video>`);
      } else {
        insertAtCursor(`[📎 ${file.name}](${url})`);
      }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const insertAtCursor = (text: string) => {
    const textarea = document.getElementById("news-content") as HTMLTextAreaElement;
    if (!textarea) { setContent(prev => prev + "\n" + text); return; }
    const start = textarea.selectionStart;
    const newContent = content.substring(0, start) + text + content.substring(start);
    setContent(newContent);
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
    const payload = {
      title, content, excerpt: excerpt || null,
      thumbnail_url: thumbnailUrl || null,
      published,
    };

    let savedNewsId: string | null = null;

    if (editing) {
      const { error } = await supabase.from("news").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      savedNewsId = editing.id;
      toast.success("News updated!");
    } else {
      const { data, error } = await supabase.from("news").insert(payload).select("id").single();
      if (error) { toast.error(error.message); setSaving(false); return; }
      savedNewsId = data?.id || null;
      toast.success("News created!");
    }

    // Auto-send newsletter if published and auto-newsletter is enabled
    if (published && savedNewsId) {
      try {
        const { data: nlSettings } = await supabase.from("site_settings").select("value").eq("key", "newsletter_settings").single();
        if (nlSettings?.value && (nlSettings.value as any).auto_on_publish) {
          const articleUrl = `${window.location.origin}/news`;
          const htmlContent = `<h1>${title}</h1>${excerpt ? `<p>${excerpt}</p>` : ""}<p>${content.substring(0, 300)}...</p><p><a href="${articleUrl}">Read more on Zerolord</a></p>`;
          const { data: result } = await supabase.functions.invoke("send-newsletter", {
            body: { subject: `📰 ${title}`, content: htmlContent, contentType: "html" },
          });
          if (result?.sent) {
            await supabase.from("newsletter_logs").insert({
              subject: `📰 ${title}`,
              content: htmlContent,
              content_type: "html",
              recipient_count: result.sent,
              trigger_type: "auto",
              news_id: savedNewsId,
            } as any);
            toast.success(`Auto-newsletter sent to ${result.sent} subscribers!`);
          }
        }
      } catch (err) {
        console.error("Auto-newsletter error:", err);
      }
    }

    resetForm();
    fetchNews();
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

          {/* Thumbnail */}
          <div>
            <Label>Thumbnail</Label>
            <div className="flex gap-2 mt-1">
              <Input value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="Image URL or upload..." className="flex-1" />
              <Button type="button" variant="outline" size="icon" onClick={() => thumbnailInputRef.current?.click()} disabled={uploading}>
                <Upload className="h-4 w-4" />
              </Button>
              <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
            </div>
            {thumbnailUrl && (
              <img src={thumbnailUrl} alt="Thumbnail preview" className="mt-2 h-24 rounded-lg object-cover" />
            )}
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={published} onCheckedChange={setPublished} />
            <Label>Published</Label>
          </div>
        </Card>

        {/* Rich Editor Toolbar */}
        <Card className="p-3">
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("**", "**")} title="Bold"><Bold className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("*", "*")} title="Italic"><Italic className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("# ")} title="Heading 1"><Heading1 className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("## ")} title="Heading 2"><Heading2 className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("- ")} title="List"><List className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("[", "](url)")} title="Link"><LinkIcon className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("![alt](", ")")} title="Image"><Image className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("`", "`")} title="Code"><Code className="h-4 w-4" /></Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("```\n", "\n```")} title="Code Block"><span className="text-xs font-mono">{"{ }"}</span></Button>
            <Button size="sm" variant="ghost" onClick={() => insertMarkdown("---\n")} title="Divider"><span className="text-xs">—</span></Button>
            <div className="border-l border-border mx-1" />
            <Button size="sm" variant="ghost" onClick={() => fileInputRef.current?.click()} title="Upload file/image" disabled={uploading}>
              <FileUp className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => {
              const url = prompt("Paste embed URL (YouTube, etc.):");
              if (url) insertAtCursor(`<iframe src="${url}" width="100%" height="400" frameborder="0" allowfullscreen style="border-radius:8px"></iframe>`);
            }} title="Embed">
              <Video className="h-4 w-4" />
            </Button>
            <input ref={fileInputRef} type="file" accept="*/*" className="hidden" onChange={handleFileInsert} />
          </div>
        </Card>

        {/* Content Editor */}
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <Label className="mb-2 block">Content (Markdown + HTML)</Label>
            <Textarea
              id="news-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your news article here. Supports Markdown and HTML embeds..."
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
            <Card key={item.id} className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {item.thumbnail_url ? (
                    <img src={item.thumbnail_url} alt="" className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Newspaper className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">{item.title}</h3>
                      <Badge variant={item.published ? "default" : "secondary"} className="shrink-0 text-xs">
                        {item.published ? "Live" : "Draft"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 self-end sm:self-center">
                  <Button size="sm" variant="outline" onClick={() => startEdit(item)} className="gap-1 text-xs sm:text-sm">
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

function markdownToHtml(md: string): string {
  // First, extract and preserve HTML blocks (iframes, video, etc.)
  const htmlBlocks: string[] = [];
  let processed = md.replace(/<(iframe|video|audio|embed|object|div|table)[^>]*>[\s\S]*?<\/\1>/gi, (match) => {
    htmlBlocks.push(match);
    return `__HTML_BLOCK_${htmlBlocks.length - 1}__`;
  });
  // Also preserve self-closing/void HTML
  processed = processed.replace(/<(iframe|video|audio|embed|img|source|br|hr)[^>]*\/?>/gi, (match) => {
    htmlBlocks.push(match);
    return `__HTML_BLOCK_${htmlBlocks.length - 1}__`;
  });

  let html = processed
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  // Bold & italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px" />');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-primary underline">$1</a>');
  // HR
  html = html.replace(/^---$/gm, "<hr />");
  // Lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
  // Paragraphs
  html = html.replace(/^(?!<[huploi]|<\/|<hr|<pre|<code|__HTML)(.+)$/gm, "<p>$1</p>");

  // Restore HTML blocks
  htmlBlocks.forEach((block, i) => {
    html = html.replace(`__HTML_BLOCK_${i}__`, block);
  });

  return html;
}

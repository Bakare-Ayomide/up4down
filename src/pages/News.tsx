import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, Clock, Loader2 } from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  published: boolean;
  created_at: string;
}

// Same markdown converter as admin
function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  html = html.replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-primary underline">$1</a>');
  html = html.replace(/^---$/gm, "<hr />");
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
  html = html.replace(/^(?!<[huploi]|<\/|<hr|<pre|<code)(.+)$/gm, "<p>$1</p>");
  return html;
}

const News = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NewsItem | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const { data } = await supabase
      .from("news")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (data) setNews(data as any);
    setLoading(false);
  };

  if (selected) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-3xl">
          <button
            onClick={() => setSelected(null)}
            className="text-primary hover:underline mb-6 inline-block"
          >
            ← Back to News
          </button>
          <article>
            <h1 className="text-4xl font-bold mb-4">{selected.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
              <Clock className="h-4 w-4" />
              {new Date(selected.created_at).toLocaleDateString("en-US", {
                year: "numeric", month: "long", day: "numeric",
              })}
            </div>
            <Card className="p-6 prose prose-sm dark:prose-invert max-w-none">
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(selected.content) }} />
            </Card>
          </article>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-muted/50" />
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Newspaper className="h-6 w-6 text-primary" />
            </div>
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">Updates</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">News</h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Latest updates, announcements, and articles from Zerolord
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : news.length > 0 ? (
          <div className="grid gap-6">
            {news.map((item) => (
              <Card
                key={item.id}
                className="p-6 hover:border-primary/30 transition-all cursor-pointer hover:shadow-[var(--shadow-card-hover)]"
                onClick={() => setSelected(item)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold hover:text-primary transition-colors">{item.title}</h2>
                    {item.excerpt && (
                      <p className="text-muted-foreground">{item.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(item.created_at).toLocaleDateString("en-US", {
                        year: "numeric", month: "long", day: "numeric",
                      })}
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">Read</Badge>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <Newspaper className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No news yet</h3>
            <p className="text-muted-foreground">Check back later for updates</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default News;

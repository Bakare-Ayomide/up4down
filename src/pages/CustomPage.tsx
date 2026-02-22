import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import NotFound from "./NotFound";

interface PageBlock {
  id: string;
  type: "heading" | "text" | "image" | "button" | "divider" | "html";
  content: string;
  props?: Record<string, any>;
}

const CustomPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      const { data } = await supabase
        .from("custom_pages")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      setPage(data);
      setLoading(false);
    };
    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!page) return <NotFound />;

  const blocks: PageBlock[] = Array.isArray(page.content) ? page.content : [];

  return (
    <main className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
      <div className="space-y-6">
        {blocks.map((block) => {
          switch (block.type) {
            case "heading":
              return <h2 key={block.id} className="text-2xl md:text-3xl font-bold">{block.content}</h2>;
            case "text":
              return <p key={block.id} className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{block.content}</p>;
            case "image":
              return <img key={block.id} src={block.content} alt={block.props?.alt || ""} className="w-full rounded-xl border border-border" />;
            case "button":
              return (
                <div key={block.id}>
                  <a href={block.props?.url || "#"} target="_blank" rel="noopener noreferrer">
                    <Button className="rounded-xl">{block.content}</Button>
                  </a>
                </div>
              );
            case "divider":
              return <hr key={block.id} className="border-border" />;
            case "html":
              return <div key={block.id} className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: block.content }} />;
            default:
              return null;
          }
        })}
      </div>
    </main>
  );
};

export default CustomPage;

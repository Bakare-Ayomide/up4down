import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingDisplay } from "@/components/RatingDisplay";
import { RatingInput } from "@/components/RatingInput";
import { RelatedItems } from "@/components/RelatedItems";
import { Download as DownloadIcon, Eye, Star, Clock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ImageCarousel } from "@/components/ImageCarousel";

interface DownloadItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  download_url: string;
  file_type: string;
  file_size: string | null;
  version: string | null;
  download_count: number;
  average_rating: number;
  rating_count: number;
  created_at: string;
  custom_js?: string | null;
  categories?: { category_id: string }[];
}

interface Category {
  name: string;
}

const Download = () => {
  const { id } = useParams();
  const [item, setItem] = useState<DownloadItem | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    if (!id) return;

    const { data: itemData } = await supabase
      .from("download_items")
      .select("*, download_item_categories(category_id)")
      .eq("id", id)
      .single();

    if (itemData) {
      setItem(itemData);

      // Fetch first category name if available
      if (itemData.download_item_categories && itemData.download_item_categories.length > 0) {
        const { data: categoryData } = await supabase
          .from("categories")
          .select("name")
          .eq("id", itemData.download_item_categories[0].category_id)
          .single();

        if (categoryData) setCategory(categoryData);
      }
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    if (!item) return;

    try {
      await supabase.rpc("increment_download_count", { item_id: item.id });
      
      // Execute custom JavaScript if provided
      if (item.custom_js) {
        try {
          const customFunction = new Function('item', 'window', 'document', item.custom_js);
          customFunction(item, window, document);
        } catch (jsError) {
          console.error("Custom JS execution error:", jsError);
        }
      }
      
      window.open(item.download_url, "_blank");
      toast.success("Download started!");
      
      // Refresh download count
      fetchItem();
    } catch (error) {
      toast.error("Failed to start download");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="relative inline-flex">
            <div className="h-10 w-10 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <DownloadIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Item not found</h1>
          <Link to="/">
            <Button variant="outline" className="rounded-xl">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Link to="/browse" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Browse
        </Link>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 border-border/50 shadow-[var(--shadow-card)]">
              {item.thumbnail_url && (() => {
                try {
                  const urls = JSON.parse(item.thumbnail_url);
                  const thumbnailUrls = Array.isArray(urls) ? urls : [item.thumbnail_url];
                  
                  if (thumbnailUrls.length > 1) {
                    return <ImageCarousel images={thumbnailUrls} title={item.title} />;
                  }
                  
                  return (
                    <img
                      src={thumbnailUrls[0]}
                      alt={item.title}
                      className="w-full h-64 object-cover rounded-xl mb-6"
                    />
                  );
                } catch {
                  return (
                    <img
                      src={item.thumbnail_url}
                      alt={item.title}
                      className="w-full h-64 object-cover rounded-xl mb-6"
                    />
                  );
                }
              })()}

              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold mb-3">{item.title}</h1>
                  {category && (
                    <Badge variant="secondary" className="rounded-lg">{category.name}</Badge>
                  )}
                </div>

                <div className="flex items-center gap-6 text-sm text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    {item.download_count.toLocaleString()} downloads
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-primary fill-primary" />
                    <span className="font-medium text-foreground">{item.average_rating.toFixed(1)}</span>
                    ({item.rating_count} ratings)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                {item.description && (
                  <div className="pt-4 border-t border-border/50">
                    <h2 className="font-semibold mb-2">Description</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 border-border/50 shadow-[var(--shadow-card)]">
              <h2 className="font-semibold mb-4">Rate this download</h2>
              <RatingInput itemId={item.id} onRatingSubmit={fetchItem} />
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-6 sticky top-20 border-border/50 shadow-[var(--shadow-card)]">
              <Button
                onClick={handleDownload}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[var(--shadow-glow)] hover:shadow-xl transition-all duration-300 rounded-xl h-12 text-base font-semibold"
                size="lg"
              >
                <DownloadIcon className="mr-2 h-5 w-5" />
                Download Now
              </Button>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">File Type</span>
                  <Badge variant="outline" className="font-medium">{item.file_type.toUpperCase()}</Badge>
                </div>
                {item.file_size && (
                  <div className="flex justify-between py-2 border-t border-border/50">
                    <span className="text-muted-foreground">Size</span>
                    <span className="font-medium">{item.file_size}</span>
                  </div>
                )}
                {item.version && (
                  <div className="flex justify-between py-2 border-t border-border/50">
                    <span className="text-muted-foreground">Version</span>
                    <span className="font-medium">{item.version}</span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-border/50">
                <RatingDisplay rating={item.average_rating} count={item.rating_count} />
              </div>
            </Card>
          </div>
        </div>

        {/* Related Items - Always show on download page */}
        <div className="mt-12">
          <RelatedItems 
            currentItemId={item.id} 
            categoryIds={item.categories?.map(ic => ic.category_id) || []} 
          />
        </div>
      </main>
    </div>
  );
};

export default Download;

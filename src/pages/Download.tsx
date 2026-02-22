import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RatingDisplay } from "@/components/RatingDisplay";
import { RatingInput } from "@/components/RatingInput";
import { RelatedItems } from "@/components/RelatedItems";
import { DownloadModal } from "@/components/DownloadModal";
import { Download as DownloadIcon, Eye, Star, Clock, ArrowLeft, FileType, HardDrive, Tag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ImageCarousel } from "@/components/ImageCarousel";
import { useSubscription } from "@/hooks/useSubscription";
import { useFreeDownloads } from "@/hooks/useFreeDownloads";
import { useSiteSettings } from "@/hooks/useSiteSettings";

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
  const [showModal, setShowModal] = useState(false);
  const { isSubscribed } = useSubscription();
  const { recordDownload } = useFreeDownloads();
  const { settings } = useSiteSettings();

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

  const handleDownloadClick = () => {
    if (isSubscribed) {
      executeDownload();
    } else {
      setShowModal(true);
    }
  };

  const handleFreeDownload = async () => {
    if (settings.ad_settings.custom_js_enabled && item?.custom_js) {
      try {
        const customFunction = new Function('item', 'window', 'document', item.custom_js);
        const result = customFunction(item, window, document);
        if (result === false) return;
      } catch (jsError) {
        console.error("Custom JS execution error:", jsError);
      }
    }

    if (settings.ad_settings.ad_urls.length > 0) {
      const randomAd = settings.ad_settings.ad_urls[Math.floor(Math.random() * settings.ad_settings.ad_urls.length)];
      window.open(randomAd, "_blank");
    }

    recordDownload();
    executeDownload();
  };

  const executeDownload = async () => {
    if (!item) return;
    try {
      await supabase.rpc("increment_download_count", { item_id: item.id });
      window.open(item.download_url, "_blank");
      toast.success("Download started!");
      fetchItem();
    } catch {
      toast.error("Failed to start download");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="relative inline-flex mb-4">
          <div className="h-16 w-16 rounded-full border-4 border-muted" />
          <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <div className="h-24 w-24 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
          <DownloadIcon className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Item not found</h1>
        <Link to="/">
          <Button variant="outline" className="rounded-full">Go Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Link to="/browse" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          Back to Browse
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-border bg-card">
              {item.thumbnail_url && (() => {
                try {
                  const urls = JSON.parse(item.thumbnail_url);
                  const thumbnailUrls = Array.isArray(urls) ? urls : [item.thumbnail_url];
                  if (thumbnailUrls.length > 1) {
                    return <ImageCarousel images={thumbnailUrls} title={item.title} />;
                  }
                  return <img src={thumbnailUrls[0]} alt={item.title} className="w-full h-80 object-cover" />;
                } catch {
                  return <img src={item.thumbnail_url} alt={item.title} className="w-full h-80 object-cover" />;
                }
              })()}
            </Card>

            <Card className="p-8 border-border bg-card">
              <div className="space-y-6">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-3xl md:text-4xl font-bold">{item.title}</h1>
                    {category && (
                      <Badge variant="secondary" className="rounded-full px-4 py-1 whitespace-nowrap">
                        {category.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                      <Eye className="h-4 w-4" />
                      {item.download_count.toLocaleString()} downloads
                    </span>
                    <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                      <Star className="h-4 w-4 text-primary fill-primary" />
                      <span className="font-semibold text-foreground">{item.average_rating.toFixed(1)}</span>
                      ({item.rating_count})
                    </span>
                    <span className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                      <Clock className="h-4 w-4" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {item.description && (
                  <div className="pt-6 border-t border-border">
                    <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Description
                    </h2>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{item.description}</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-8 border-border bg-card">
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Rate this download
              </h2>
              <RatingInput itemId={item.id} onRatingSubmit={fetchItem} />
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 sticky top-24 border-border bg-card neon-border">
              <Button
                onClick={handleDownloadClick}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[var(--shadow-glow)] hover:shadow-[var(--neon-glow)] transition-all duration-500 rounded-xl h-14 text-lg font-semibold glow-button"
                size="lg"
              >
                <DownloadIcon className="mr-2 h-5 w-5" />
                Download Now
              </Button>

              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-2"><FileType className="h-4 w-4" />File Type</span>
                  <Badge variant="outline" className="font-semibold uppercase">{item.file_type}</Badge>
                </div>
                {item.file_size && (
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground flex items-center gap-2"><HardDrive className="h-4 w-4" />Size</span>
                    <span className="font-semibold">{item.file_size}</span>
                  </div>
                )}
                {item.version && (
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-muted-foreground flex items-center gap-2"><Tag className="h-4 w-4" />Version</span>
                    <span className="font-semibold">{item.version}</span>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-border">
                <RatingDisplay rating={item.average_rating} count={item.rating_count} />
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-16">
          <RelatedItems 
            currentItemId={item.id} 
            categoryIds={item.categories?.map(ic => ic.category_id) || []} 
          />
        </div>
        <DownloadModal
          open={showModal}
          onOpenChange={setShowModal}
          onFreeDownload={handleFreeDownload}
          itemTitle={item?.title || ""}
        />
      </main>
    </div>
  );
};

export default Download;

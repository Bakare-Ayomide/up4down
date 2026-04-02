import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { DownloadCard } from "@/components/DownloadCard";
import { Loader2, Search, PackageOpen } from "lucide-react";
import { AdBanner } from "@/components/AdBanner";
import { AdSlot } from "@/components/AdSlot";
import { normalizeIcon } from "@/lib/normalizeIcon";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface DownloadItem {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  file_type: string;
  download_count: number;
  average_rating: number;
  rating_count: number;
  categories?: { category_id: string }[];
}

const Browse = () => {
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<DownloadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [categoryParam] : []
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [selectedCategories]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (data) setCategories(data.map(c => ({ ...c, icon: normalizeIcon(c.icon) || "" })));
  };

  const fetchItems = async () => {
    setLoading(true);
    
    if (selectedCategories.length > 0) {
      const selectedCats = categories.filter(c => selectedCategories.includes(c.slug));
      const categoryIds = selectedCats.map(c => c.id);

      if (categoryIds.length > 0) {
        const { data: itemCategories } = await supabase
          .from("download_item_categories")
          .select("item_id")
          .in("category_id", categoryIds);

        if (itemCategories) {
          const itemIds = [...new Set(itemCategories.map(ic => ic.item_id))];
          const { data } = await supabase
            .from("download_items")
            .select("*, download_item_categories!inner(category_id)")
            .in("id", itemIds)
            .order("created_at", { ascending: false });

          if (data) setItems(data);
        }
      }
    } else {
      const { data } = await supabase
        .from("download_items")
        .select("*, download_item_categories(category_id)")
        .order("created_at", { ascending: false });

      if (data) setItems(data);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-muted/50" />
        <div className="absolute inset-0 bg-grid-pattern opacity-50" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
        
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">Explore</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Browse Downloads</h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Discover our curated collection of files, apps, and software
          </p>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <AdBanner page="browse" position="top" />
        <AdBanner page="browse" position="after-header" />
        <AdBanner page="browse" position="before-listing" />
        <CategoryFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onSelectCategories={setSelectedCategories}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-4">
              <div className="h-16 w-16 rounded-full border-4 border-muted" />
              <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <p className="text-muted-foreground">Loading downloads...</p>
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <DownloadCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="h-24 w-24 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
              <PackageOpen className="h-12 w-12 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or check back later</p>
          </div>
        )}
        <AdBanner page="browse" position="after-listing" />
        <AdBanner page="browse" position="before-footer" />
        <AdBanner page="browse" position="bottom" />
      </main>
    </div>
  );
};

export default Browse;

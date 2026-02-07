import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { CategoryFilter } from "@/components/CategoryFilter";
import { DownloadCard } from "@/components/DownloadCard";
import { Loader2 } from "lucide-react";

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
    if (data) setCategories(data);
  };

  const fetchItems = async () => {
    setLoading(true);
    
    if (selectedCategories.length > 0) {
      // Get category IDs from slugs
      const selectedCats = categories.filter(c => selectedCategories.includes(c.slug));
      const categoryIds = selectedCats.map(c => c.id);

      if (categoryIds.length > 0) {
        // Get items with any of these categories from junction table
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
      // Get all items
      const { data } = await supabase
        .from("download_items")
        .select("*, download_item_categories(category_id)")
        .order("created_at", { ascending: false });

      if (data) setItems(data);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-10">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Explore</span>
          <h1 className="text-4xl md:text-5xl font-bold mt-2 mb-3">Browse Downloads</h1>
          <p className="text-muted-foreground text-lg">Explore our curated collection of files</p>
        </div>

        <CategoryFilter
          categories={categories}
          selectedCategories={selectedCategories}
          onSelectCategories={setSelectedCategories}
        />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-primary/20" />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <DownloadCard key={item.id} item={item} />
            ))}
            {items.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg font-medium">No items found</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Browse;

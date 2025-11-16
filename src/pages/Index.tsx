import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { DownloadCard } from "@/components/DownloadCard";
import { RelatedItems } from "@/components/RelatedItems";
import { Download, Sparkles, Shield, Zap } from "lucide-react";
const Index = () => {
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    // Fetch featured items (items marked as featured by admin)
    const {
      data: items
    } = await supabase.from("download_items").select("*").eq("featured", true).order("created_at", {
      ascending: false
    }).limit(8);
    if (items) setFeaturedItems(items);

    // Fetch categories
    const {
      data: cats
    } = await supabase.from("categories").select("*").order("name");
    if (cats) setCategories(cats);
  };
  return <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-hero-gradient py-24 md:py-32">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full mb-6">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-slate-200">
                Your Ultimate Download Platform
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
              Download Anything
              <span className="block text-slate-300">Anywhere, Anytime </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Access thousands of apps, software, games, videos, and more. All in one place, free for lifetime.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/browse">
                <Button size="lg" className="bg-accent hover:bg-accent/90 shadow-glow text-lg">
                  <Download className="mr-2 h-5 w-5" />
                  Browse Downloads
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 text-lg text-zinc-950">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Up4Down?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We provide a seamless experience for downloading all types of files
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6">
              <div className="h-16 w-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Downloads</h3>
              <p className="text-muted-foreground">
                Get your files quickly with optimized download links
              </p>
            </div>

            <div className="text-center p-6">
              <div className="h-16 w-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
              <p className="text-muted-foreground">
                All files are checked and verified for your safety
              </p>
            </div>

            <div className="text-center p-6">
              <div className="h-16 w-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Download className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Huge Library</h3>
              <p className="text-muted-foreground">
                Access thousands of apps, games, software, and more
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Browse by Category</h2>
              <p className="text-muted-foreground text-lg">
                Find exactly what you're looking for
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {categories.map(category => <Link key={category.id} to={`/browse?category=${category.slug}`}>
                  <div className="p-6 rounded-xl border border-border hover:border-accent hover:shadow-glow transition-all duration-300 text-center group">
                    <h3 className="font-semibold group-hover:text-accent transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>)}
            </div>
          </div>
        </section>}

      {/* Featured Downloads Section */}
      {featuredItems.length > 0 && <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Downloads</h2>
              <p className="text-muted-foreground text-lg">
                Hand-picked items selected by our team
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {featuredItems.map(item => <DownloadCard key={item.id} item={item} />)}
            </div>

            <div className="text-center mt-12">
              <Link to="/browse">
                <Button size="lg" variant="outline">
                  View All Downloads
                </Button>
              </Link>
            </div>
          </div>
        </section>}

      {/* All Downloads Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <RelatedItems currentItemId="" categoryIds={[]} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 font-bold text-lg">
              <Download className="h-6 w-6 text-accent" />
              <span>Up4Down</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 Up4Down. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;
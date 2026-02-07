import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { DownloadCard } from "@/components/DownloadCard";
import { RelatedItems } from "@/components/RelatedItems";
import { Download, Sparkles, Shield, Zap, ArrowRight, Star } from "lucide-react";

const Index = () => {
  const [featuredItems, setFeaturedItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: items } = await supabase
      .from("download_items")
      .select("*")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(8);
    if (items) setFeaturedItems(items);

    const { data: cats } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (cats) setCategories(cats);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 md:py-32">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-[var(--hero-gradient)]" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white/90">
                Your Ultimate Download Platform
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-white leading-tight">
              Download Anything
              <span className="block text-white/80 mt-2">Anywhere, Anytime</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Access thousands of apps, software, games, videos, and more. All in one place, free for lifetime.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/browse">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all duration-300 text-lg h-14 px-8 rounded-xl font-semibold group">
                  <Download className="mr-2 h-5 w-5" />
                  Browse Downloads
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-lg text-white h-14 px-8 rounded-xl font-semibold">
                  Learn More
                </Button>
              </a>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-16 pt-8 border-t border-white/10">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-sm text-white/60">Downloads</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-sm text-white/60">Files</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white flex items-center gap-1 justify-center">
                  4.9 <Star className="h-5 w-5 fill-white" />
                </div>
                <div className="text-sm text-white/60">Rating</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Why Choose Us</span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">Why Choose Up4Down?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We provide a seamless experience for downloading all types of files
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Zap,
                title: "Fast Downloads",
                description: "Get your files quickly with optimized download links and lightning-fast servers",
              },
              {
                icon: Shield,
                title: "Safe & Secure",
                description: "All files are checked and verified for your safety with advanced security scans",
              },
              {
                icon: Download,
                title: "Huge Library",
                description: "Access thousands of apps, games, software, and more in our extensive collection",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 group"
              >
                <div className="h-16 w-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Categories</span>
              <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">Browse by Category</h2>
              <p className="text-muted-foreground text-lg">
                Find exactly what you're looking for
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {categories.map((category) => (
                <Link key={category.id} to={`/browse?category=${category.slug}`}>
                  <div className="p-6 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-[var(--shadow-card-hover)] transition-all duration-300 text-center group cursor-pointer">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Downloads Section */}
      {featuredItems.length > 0 && (
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Featured</span>
              <h2 className="text-3xl md:text-5xl font-bold mt-3 mb-4">Featured Downloads</h2>
              <p className="text-muted-foreground text-lg">
                Hand-picked items selected by our team
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {featuredItems.map((item) => (
                <DownloadCard key={item.id} item={item} />
              ))}
            </div>

            <div className="text-center mt-12">
              <Link to="/browse">
                <Button size="lg" variant="outline" className="rounded-xl h-12 px-8 font-semibold group">
                  View All Downloads
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* All Downloads Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <RelatedItems currentItemId="" categoryIds={[]} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-16 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                <Download className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Up4Down</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 Up4Down. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
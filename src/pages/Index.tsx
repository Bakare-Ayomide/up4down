import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { DownloadCard } from "@/components/DownloadCard";
import { RelatedItems } from "@/components/RelatedItems";
import { Download, Sparkles, Shield, Zap, ArrowRight, Star, Folder, ChevronRight } from "lucide-react";

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

      {/* Hero Section - Cyberpunk Style */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/30" />
        <div className="absolute inset-0 bg-grid-pattern" />
        
        {/* Animated orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/15 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px]" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left content */}
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-primary/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8 border border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    Ultimate Download Hub
                  </span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight">
                  Download
                  <span className="block text-gradient">Anything</span>
                  <span className="block text-muted-foreground text-4xl md:text-5xl mt-2">Anywhere</span>
                </h1>

                <p className="text-xl text-muted-foreground mb-10 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Access thousands of apps, games, software, and media.
                  <span className="text-primary font-medium"> Starting at just $0.99/month.</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Link to="/browse">
                    <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[var(--shadow-glow)] hover:shadow-[var(--neon-glow)] transition-all duration-500 text-lg h-14 px-8 rounded-full font-semibold group glow-button">
                      <Download className="mr-2 h-5 w-5" />
                      Explore Now
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <a href="#features">
                    <Button size="lg" variant="outline" className="border-border bg-background/50 backdrop-blur-sm hover:bg-muted text-lg h-14 px-8 rounded-full font-semibold">
                      Learn More
                    </Button>
                  </a>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-8 mt-12 pt-8 border-t border-border">
                  {[
                    { value: "10K+", label: "Downloads" },
                    { value: "500+", label: "Files" },
                    { value: "4.9", label: "Rating", icon: Star },
                  ].map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl font-bold text-foreground flex items-center gap-1 justify-center">
                        {stat.value}
                        {stat.icon && <stat.icon className="h-5 w-5 text-primary fill-primary" />}
                      </div>
                      <div className="text-sm text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Hero Visual */}
              <div className="hidden lg:block relative">
                <div className="relative">
                  {/* Main card */}
                  <div className="bg-card border border-border rounded-3xl p-8 shadow-[var(--shadow-card)] neon-border">
                    <div className="grid grid-cols-2 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="aspect-square rounded-2xl bg-gradient-to-br from-muted to-secondary flex items-center justify-center animate-float"
                          style={{ animationDelay: `${i * 0.5}s` }}
                        >
                          <Download className="h-8 w-8 text-primary/50" />
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Floating elements */}
                  <div className="absolute -top-6 -right-6 bg-primary text-primary-foreground rounded-2xl px-4 py-2 shadow-[var(--shadow-glow)] animate-float font-semibold text-sm">
                    ✨ Premium Access
                  </div>
                  <div className="absolute -bottom-4 -left-4 bg-card border border-border rounded-2xl px-4 py-2 shadow-lg animate-float font-medium text-sm" style={{ animationDelay: '-2s' }}>
                    <span className="text-primary">⚡</span> Fast Downloads
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 bg-muted/30" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-16">
            <span className="text-primary font-semibold text-sm uppercase tracking-widest">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-5">Why Choose Us?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experience the best download platform with lightning-fast speeds
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Optimized servers deliver your files at maximum speed with zero throttling",
                color: "from-yellow-500/20 to-orange-500/10",
              },
              {
                icon: Shield,
                title: "100% Secure",
                description: "Every file is scanned and verified for your complete safety and peace of mind",
                color: "from-green-500/20 to-emerald-500/10",
              },
              {
                icon: Download,
                title: "Massive Library",
                description: "Access our ever-growing collection of apps, games, software, and more",
                color: "from-blue-500/20 to-cyan-500/10",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1"
              >
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
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
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <span className="text-primary font-semibold text-sm uppercase tracking-widest">Categories</span>
                <h2 className="text-4xl md:text-5xl font-bold mt-4">Browse by Category</h2>
              </div>
              <Link to="/browse">
                <Button variant="ghost" className="text-primary hover:text-primary/80 group">
                  View All
                  <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link key={category.id} to={`/browse?category=${category.slug}`}>
                  <div className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 text-center cursor-pointer">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/10 transition-colors">
                      <Folder className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Downloads */}
      {featuredItems.length > 0 && (
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
              <div>
                <span className="text-primary font-semibold text-sm uppercase tracking-widest">Featured</span>
                <h2 className="text-4xl md:text-5xl font-bold mt-4">Top Picks</h2>
              </div>
              <Link to="/browse">
                <Button variant="outline" className="rounded-full group">
                  See All Downloads
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredItems.map((item) => (
                <DownloadCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Downloads */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <RelatedItems currentItemId="" categoryIds={[]} />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-[var(--shadow-glow)]">
                <Download className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">
                Up<span className="text-primary">4</span>Down
              </span>
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
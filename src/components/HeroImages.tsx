import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download } from "lucide-react";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";
import hero4 from "@/assets/hero-4.jpg";

const defaultImages = [hero1, hero2, hero3, hero4];

export const HeroImages = () => {
  const [images, setImages] = useState<string[]>(defaultImages);

  useEffect(() => {
    const fetchHeroImages = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "hero_images")
        .maybeSingle();
      if (data?.value && Array.isArray(data.value) && data.value.length === 4) {
        // Only use if all 4 are non-empty URLs
        const urls = data.value as string[];
        if (urls.every((u) => typeof u === "string" && u.startsWith("http"))) {
          setImages(urls);
        }
      }
    };
    fetchHeroImages();
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      {images.map((src, i) => (
        <div
          key={i}
          className="aspect-square rounded-2xl overflow-hidden animate-float border border-border"
          style={{ animationDelay: `${i * 0.5}s` }}
        >
          <img src={src} alt={`Hero ${i + 1}`} className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
};

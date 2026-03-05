import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const SEOHead = () => {
  const { settings, loading } = useSiteSettings();

  useEffect(() => {
    if (loading) return;
    const seo = settings.seo_settings;
    const app = settings.app_settings;

    document.title = seo.meta_title || app.app_name || "Zerolord";

    const setMeta = (name: string, content: string, attr = "name") => {
      if (!content) return;
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta("description", seo.meta_description);
    setMeta("keywords", seo.meta_keywords);
    setMeta("og:title", seo.og_title || seo.meta_title, "property");
    setMeta("og:description", seo.og_description || seo.meta_description, "property");
    setMeta("og:image", seo.og_image, "property");
    setMeta("og:url", seo.og_url || app.website_url, "property");
    setMeta("og:type", "website", "property");
    setMeta("twitter:card", seo.twitter_card_type || "summary_large_image");
    setMeta("twitter:title", seo.twitter_title || seo.og_title || seo.meta_title);
    setMeta("twitter:description", seo.twitter_description || seo.og_description || seo.meta_description);
    setMeta("twitter:image", seo.twitter_image || seo.og_image);
  }, [settings, loading]);

  return null;
};

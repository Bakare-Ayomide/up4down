import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  subscription_price: { amount: number; currency: string };
  free_tier_limits: { daily_limit: number; monthly_limit: number };
  ad_settings: {
    ad_urls: string[];
    adsense_enabled: boolean;
    adsense_client_id: string;
    ad_slot_id: string;
    adsterra_enabled: boolean;
    adsterra_publisher_id: string;
    adsterra_ad_key: string;
    custom_js_enabled: boolean;
  };
  payment_settings: {
    bank_name: string;
    account_name: string;
    account_number: string;
    routing_number: string;
    instructions: string;
    payment_methods: string[];
  };
  app_settings: {
    app_name: string;
    app_description: string;
    support_email: string;
    support_url: string;
    privacy_policy_url: string;
    terms_of_service_url: string;
    website_url: string;
  };
  seo_settings: {
    meta_title: string;
    meta_description: string;
    meta_keywords: string;
    og_title: string;
    og_description: string;
    og_image: string;
    og_url: string;
    twitter_card_type: string;
    twitter_title: string;
    twitter_description: string;
    twitter_image: string;
  };
  social_links: {
    twitter_url: string;
    instagram_url: string;
    facebook_url: string;
    youtube_url: string;
    telegram_url: string;
    discord_url: string;
    visible_icons: Record<string, boolean>;
  };
  app_store_settings: {
    app_store_keywords: string;
    short_description: string;
    long_description: string;
    promotional_text: string;
    app_store_support_url: string;
    app_store_marketing_url: string;
  };
  analytics_settings: {
    google_analytics_id: string;
    facebook_pixel_id: string;
  };
  indexnow_settings: {
    enabled: boolean;
    api_key: string;
  };
  robots_settings: {
    indexing_enabled: boolean;
    custom_rules: string;
  };
}

const defaults: SiteSettings = {
  subscription_price: { amount: 0.99, currency: "USD" },
  free_tier_limits: { daily_limit: 3, monthly_limit: 20 },
  ad_settings: { ad_urls: [], adsense_enabled: false, adsense_client_id: "", ad_slot_id: "", adsterra_enabled: false, adsterra_publisher_id: "", adsterra_ad_key: "", custom_js_enabled: true },
  payment_settings: { bank_name: "", account_name: "", account_number: "", routing_number: "", instructions: "", payment_methods: [] },
  app_settings: { app_name: "Zerolord", app_description: "Download Apps, Games, Software & More", support_email: "", support_url: "", privacy_policy_url: "", terms_of_service_url: "", website_url: "" },
  seo_settings: { meta_title: "Zerolord - Download Apps, Games, Software & More", meta_description: "Download thousands of apps, games, software, videos, and files.", meta_keywords: "download,apps,games,software", og_title: "Zerolord", og_description: "Your ultimate download platform", og_image: "", og_url: "", twitter_card_type: "summary_large_image", twitter_title: "", twitter_description: "", twitter_image: "" },
  social_links: { twitter_url: "", instagram_url: "", facebook_url: "", youtube_url: "", telegram_url: "", discord_url: "" },
  app_store_settings: { app_store_keywords: "", short_description: "", long_description: "", promotional_text: "", app_store_support_url: "", app_store_marketing_url: "" },
  analytics_settings: { google_analytics_id: "", facebook_pixel_id: "" },
  indexnow_settings: { enabled: false, api_key: "" },
  robots_settings: { indexing_enabled: true, custom_rules: "" },
};

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>(defaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (data) {
        const s = { ...defaults };
        data.forEach((row: any) => {
          if (row.key in s) {
            (s as any)[row.key] = { ...(defaults as any)[row.key], ...row.value };
          }
        });
        setSettings(s);
      }
    } catch {
      // use defaults
    } finally {
      setLoading(false);
    }
  };

  return { settings, loading, refresh: fetchSettings };
};

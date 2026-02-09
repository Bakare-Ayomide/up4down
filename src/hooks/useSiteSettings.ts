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
}

const defaults: SiteSettings = {
  subscription_price: { amount: 0.99, currency: "USD" },
  free_tier_limits: { daily_limit: 3, monthly_limit: 20 },
  ad_settings: { ad_urls: [], adsense_enabled: false, adsense_client_id: "", ad_slot_id: "", custom_js_enabled: true },
  payment_settings: { bank_name: "", account_name: "", account_number: "", routing_number: "", instructions: "", payment_methods: [] },
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
            (s as any)[row.key] = row.value;
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

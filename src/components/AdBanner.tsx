import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

interface Ad {
  id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  media_type: string;
  ad_url: string;
  redirect_url: string | null;
  position: string;
  is_active: boolean;
  ad_size: string;
  custom_width: number | null;
  custom_height: number | null;
}

interface AdBannerProps {
  page: string;
  position: string;
}

// Parse user agent for device/browser/os info
const parseUserAgent = (ua: string) => {
  let browser = "Unknown";
  let os = "Unknown";
  let deviceType = "Desktop";

  // Browser
  if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari";

  // OS
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  // Device type
  if (/Mobi|Android|iPhone/i.test(ua)) deviceType = "Mobile";
  else if (/iPad|Tablet/i.test(ua)) deviceType = "Tablet";

  return { browser, os, deviceType };
};

// Fetch geo data (cached per session)
let geoCache: { ip: string; country: string; city: string } | null = null;
const fetchGeoData = async () => {
  if (geoCache) return geoCache;
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    geoCache = { ip: data.ip || "", country: data.country_name || "", city: data.city || "" };
    return geoCache;
  } catch {
    return { ip: "", country: "", city: "" };
  }
};

const SIZE_CLASSES: Record<string, string> = {
  small: "max-h-16",
  medium: "max-h-40",
  large: "max-h-60",
  "full-width": "max-h-48 w-full",
};

export const AdBanner = ({ page, position }: AdBannerProps) => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [isPaidUser, setIsPaidUser] = useState<boolean | null>(null);
  const trackedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    checkSubscription();
    fetchAds();
  }, [page, position]);

  const checkSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setIsPaidUser(false); return; }
    const { data } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .limit(1);
    setIsPaidUser(data && data.length > 0);
  };

  const fetchAds = async () => {
    const { data } = await supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .eq("position", position)
      .contains("pages", [page]);
    if (data) setAds(data as any);
  };

  const collectEventData = async () => {
    const ua = navigator.userAgent;
    const { browser, os, deviceType } = parseUserAgent(ua);
    const geo = await fetchGeoData();
    return {
      user_agent: ua,
      browser,
      os,
      device_type: deviceType,
      ip_address: geo.ip,
      country: geo.country,
      city: geo.city,
      screen_resolution: `${screen.width}x${screen.height}`,
      referrer: document.referrer || null,
    };
  };

  const trackImpression = async (ad: Ad) => {
    if (trackedRef.current.has(ad.id)) return;
    trackedRef.current.add(ad.id);
    const eventData = await collectEventData();
    await supabase.rpc("increment_ad_impressions", { ad_id: ad.id });
    await supabase.from("ad_events").insert({
      ad_id: ad.id, event_type: "impression", page, ...eventData,
    });
  };

  const handleClick = async (ad: Ad) => {
    const eventData = await collectEventData();
    await supabase.rpc("increment_ad_clicks", { ad_id: ad.id });
    await supabase.from("ad_events").insert({
      ad_id: ad.id, event_type: "click", page, ...eventData,
    });
    window.open(ad.redirect_url || ad.ad_url, "_blank");
  };

  // Hide ads for paid users
  if (isPaidUser === null || isPaidUser === true) return null;
  if (ads.length === 0) return null;

  return (
    <div className={`w-full ${position === "sidebar" ? "" : "my-4"}`}>
      {ads.map((ad) => (
        <AdItem key={ad.id} ad={ad} onClick={() => handleClick(ad)} onVisible={() => trackImpression(ad)} position={position} />
      ))}
    </div>
  );
};

const AdItem = ({ ad, onClick, onVisible, position }: { ad: Ad; onClick: () => void; onVisible: () => void; position: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { onVisible(); obs.disconnect(); }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isHorizontal = position === "top" || position === "bottom" || position === "inline";
  const sizeClass = SIZE_CLASSES[ad.ad_size] || SIZE_CLASSES.medium;
  
  const customStyle: React.CSSProperties = ad.ad_size === "custom" && ad.custom_width && ad.custom_height
    ? { maxWidth: ad.custom_width, maxHeight: ad.custom_height }
    : {};

  const mediaClass = isHorizontal
    ? `h-20 w-32 object-cover shrink-0`
    : `w-full ${sizeClass} object-cover`;

  return (
    <div
      ref={ref}
      onClick={onClick}
      style={customStyle}
      className={`group cursor-pointer rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg mb-3 ${isHorizontal ? "flex items-center" : ""}`}
    >
      {ad.media_url && (
        ad.media_type === "video" ? (
          <video src={ad.media_url} autoPlay muted loop playsInline className={mediaClass} />
        ) : (
          <img src={ad.media_url} alt={ad.title} className={mediaClass} />
        )
      )}
      <div className={`p-3 ${isHorizontal ? "flex-1 min-w-0" : ""}`}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Ad</span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </div>
        <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{ad.title}</h4>
        {ad.description && !isHorizontal && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ad.description}</p>
        )}
      </div>
    </div>
  );
};

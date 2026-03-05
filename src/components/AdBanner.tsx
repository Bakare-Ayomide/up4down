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
}

interface AdBannerProps {
  page: string;
  position: string;
}

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

  const trackImpression = async (ad: Ad) => {
    if (trackedRef.current.has(ad.id)) return;
    trackedRef.current.add(ad.id);
    await supabase.rpc("increment_ad_impressions", { ad_id: ad.id });
    await supabase.from("ad_events").insert({
      ad_id: ad.id, event_type: "impression", page, user_agent: navigator.userAgent,
    });
  };

  const handleClick = async (ad: Ad) => {
    await supabase.rpc("increment_ad_clicks", { ad_id: ad.id });
    await supabase.from("ad_events").insert({
      ad_id: ad.id, event_type: "click", page, user_agent: navigator.userAgent,
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

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`group cursor-pointer rounded-xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all hover:shadow-lg mb-3 ${isHorizontal ? "flex items-center" : ""}`}
    >
      {ad.media_url && (
        ad.media_type === "video" ? (
          <video src={ad.media_url} autoPlay muted loop playsInline className={isHorizontal ? "h-20 w-32 object-cover shrink-0" : "w-full h-40 object-cover"} />
        ) : (
          <img src={ad.media_url} alt={ad.title} className={isHorizontal ? "h-20 w-32 object-cover shrink-0" : "w-full h-40 object-cover"} />
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

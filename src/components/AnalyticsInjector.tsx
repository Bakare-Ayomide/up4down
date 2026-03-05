import { useEffect } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const AnalyticsInjector = () => {
  const { settings, loading } = useSiteSettings();

  useEffect(() => {
    if (loading) return;
    const { google_analytics_id, facebook_pixel_id } = settings.analytics_settings;

    // Google Analytics
    if (google_analytics_id && !document.getElementById("ga-script")) {
      const s = document.createElement("script");
      s.id = "ga-script";
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${google_analytics_id}`;
      document.head.appendChild(s);
      const s2 = document.createElement("script");
      s2.id = "ga-inline";
      s2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${google_analytics_id}');`;
      document.head.appendChild(s2);
    }

    // Facebook Pixel
    if (facebook_pixel_id && !document.getElementById("fb-pixel")) {
      const s = document.createElement("script");
      s.id = "fb-pixel";
      s.textContent = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${facebook_pixel_id}');fbq('track','PageView');`;
      document.head.appendChild(s);
    }
  }, [settings, loading]);

  return null;
};

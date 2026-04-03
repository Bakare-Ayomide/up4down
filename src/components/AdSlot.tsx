import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";

interface AdSlotProps {
  placement: string;
  className?: string;
}

interface AdSnippet {
  id: string;
  name: string;
  ad_type: string;
  snippet: string;
  placement: string;
  status: string;
}

// Track which snippets have been injected to prevent duplicates
const injectedSnippets = new Set<string>();

export const AdSlot = ({ placement, className = "" }: AdSlotProps) => {
  const [snippets, setSnippets] = useState<AdSnippet[]>([]);
  const { isSubscribed, loading } = useSubscription();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSnippets();
  }, [placement]);

  const fetchSnippets = async () => {
    const { data } = await supabase
      .from("ad_snippets")
      .select("*")
      .eq("status", "active")
      .or(`placement.eq.${placement},placement.eq.global`);
    if (data) setSnippets(data as any);
  };

  useEffect(() => {
    if (!containerRef.current || snippets.length === 0) return;

    const container = containerRef.current;
    // Clear previous content
    container.innerHTML = "";

    snippets.forEach((s) => {
      // Skip if already injected (for pop/interstitial types that are global)
      if (s.ad_type === "pop" || s.ad_type === "interstitial" || s.ad_type === "direct-link") {
        if (injectedSnippets.has(s.id)) return;
        injectedSnippets.add(s.id);
      }

      const wrapper = document.createElement("div");
      wrapper.className = "ad-snippet-wrapper";
      wrapper.innerHTML = s.snippet;

      // Execute any script tags
      const scripts = wrapper.querySelectorAll("script");
      scripts.forEach((origScript) => {
        const newScript = document.createElement("script");
        // Copy all attributes
        Array.from(origScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        if (origScript.textContent) {
          newScript.textContent = origScript.textContent;
        }
        origScript.parentNode?.replaceChild(newScript, origScript);
      });

      container.appendChild(wrapper);
    });

    return () => {
      // Cleanup on unmount - only clear visual snippets, not pop/interstitial
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [snippets]);

  // Don't render for paid users only
  if (isSubscribed) return null;
  if (snippets.length === 0) return null;

  return <div ref={containerRef} className={`ad-slot ${className}`} data-placement={placement} />;
};

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  message: string;
  image: string | null;
  link: string | null;
  display_type: string;
}

export const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("status", "active")
      .or("schedule_time.is.null,schedule_time.lte.now()")
      .order("created_at", { ascending: false })
      .limit(1);
    if (data && data.length > 0) setAnnouncement(data[0] as any);
  };

  if (!announcement || dismissed.has(announcement.id)) return null;

  const dismiss = () => setDismissed(prev => new Set(prev).add(announcement.id));

  if (announcement.display_type === "popup") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 relative shadow-2xl">
          <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
          {announcement.image && (
            <img src={announcement.image} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />
          )}
          <h3 className="text-xl font-bold mb-2">{announcement.title}</h3>
          <p className="text-muted-foreground text-sm mb-4">{announcement.message}</p>
          {announcement.link && (
            <a href={announcement.link} target="_blank" rel="noopener noreferrer">
              <Button className="w-full gap-2">
                Learn More <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-primary text-primary-foreground py-3 px-4 relative">
      <div className="container mx-auto flex items-center justify-center gap-4 text-sm">
        <span className="font-semibold">{announcement.title}</span>
        <span className="hidden sm:inline">— {announcement.message}</span>
        {announcement.link && (
          <a href={announcement.link} target="_blank" rel="noopener noreferrer" className="underline font-medium flex items-center gap-1">
            Learn more <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <button onClick={dismiss} className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-70">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

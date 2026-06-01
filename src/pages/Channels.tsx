import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, Lock, Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Channel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  cover_url: string | null;
  is_public: boolean;
  is_announcement_only: boolean;
  member_count: number;
}

export default function Channels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("channels").select("*").order("member_count", { ascending: false });
      setChannels(data || []);
      setLoading(false);
    };
    load();

    const ch = supabase.channel("channels-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "channels" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-destructive" />
            Channels
          </h1>
          <p className="text-muted-foreground mt-2">Join the community. Chat, share, and stay updated in real-time.</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : channels.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No channels yet. Check back soon.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((c) => (
              <Link key={c.id} to={`/channels/${c.slug}`}>
                <Card className="group hover:border-destructive/50 transition-all overflow-hidden h-full">
                  {c.cover_url && (
                    <div className="h-24 w-full bg-cover bg-center" style={{ backgroundImage: `url(${c.cover_url})` }} />
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {c.icon_url ? (
                        <img src={c.icon_url} alt={c.name} className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-destructive to-destructive/60 flex items-center justify-center text-white font-bold">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{c.name}</h3>
                          {!c.is_public && <Lock className="h-3 w-3 text-muted-foreground" />}
                          {c.is_announcement_only && <Megaphone className="h-3 w-3 text-destructive" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{c.description}</p>
                        <Badge variant="secondary" className="mt-2 gap-1 text-xs">
                          <Users className="h-3 w-3" /> {c.member_count}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

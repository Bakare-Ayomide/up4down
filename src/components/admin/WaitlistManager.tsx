import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Download, Mail } from "lucide-react";

interface WaitlistEntry {
  id: string;
  email: string;
  source: string;
  created_at: string;
}

export const WaitlistManager = () => {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("waitlist_emails").select("*").order("created_at", { ascending: false });
    if (data) setEntries(data as any);
    setLoading(false);
  };

  const deleteEntry = async (id: string) => {
    await supabase.from("waitlist_emails").delete().eq("id", id);
    toast.success("Removed");
    fetch();
  };

  const exportCSV = () => {
    const csv = "Email,Source,Date\n" + entries.map(e => `${e.email},${e.source},${new Date(e.created_at).toLocaleDateString()}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "waitlist.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Waitlist</h2>
          <p className="text-muted-foreground">{entries.length} signups</p>
        </div>
        {entries.length > 0 && (
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        )}
      </div>

      {loading ? <p className="text-muted-foreground">Loading...</p> : entries.length === 0 ? (
        <Card className="p-12 text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No waitlist signups yet</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map(e => (
            <Card key={e.id} className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium truncate">{e.email}</span>
                <Badge variant="outline" className="text-xs shrink-0">{e.source}</Badge>
                <span className="text-xs text-muted-foreground shrink-0">{new Date(e.created_at).toLocaleDateString()}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteEntry(e.id)} className="text-destructive shrink-0">
                <Trash2 className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

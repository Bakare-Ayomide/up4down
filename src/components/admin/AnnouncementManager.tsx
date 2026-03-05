import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X, Megaphone } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  message: string;
  image: string | null;
  link: string | null;
  status: string;
  display_type: string;
  schedule_time: string | null;
  created_at: string;
}

export const AnnouncementManager = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");
  const [status, setStatus] = useState("inactive");
  const [displayType, setDisplayType] = useState("banner");
  const [scheduleTime, setScheduleTime] = useState("");

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (data) setItems(data as any);
  };

  const resetForm = () => {
    setTitle(""); setMessage(""); setImage(""); setLink("");
    setStatus("inactive"); setDisplayType("banner"); setScheduleTime("");
    setEditing(null); setShowForm(false);
  };

  const startEdit = (a: Announcement) => {
    setEditing(a); setTitle(a.title); setMessage(a.message); setImage(a.image || "");
    setLink(a.link || ""); setStatus(a.status); setDisplayType(a.display_type);
    setScheduleTime(a.schedule_time ? a.schedule_time.slice(0, 16) : ""); setShowForm(true);
  };

  const handleSave = async () => {
    if (!title) { toast.error("Title required"); return; }
    const payload: any = {
      title, message, image: image || null, link: link || null,
      status, display_type: displayType,
      schedule_time: scheduleTime || null,
    };
    if (editing) {
      await supabase.from("announcements").update(payload).eq("id", editing.id);
      toast.success("Updated!");
    } else {
      await supabase.from("announcements").insert(payload);
      toast.success("Created!");
    }
    resetForm(); fetch();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    toast.success("Deleted"); fetch();
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{editing ? "Edit" : "Create"} Announcement</h2>
          <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-5 w-5" /></Button>
        </div>
        <Card className="p-6 space-y-4">
          <div><label className="text-sm font-medium block mb-1">Title *</label><Input value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div><label className="text-sm font-medium block mb-1">Message</label><Textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} /></div>
          <div><label className="text-sm font-medium block mb-1">Image URL</label><Input value={image} onChange={e => setImage(e.target.value)} /></div>
          <div><label className="text-sm font-medium block mb-1">Link</label><Input value={link} onChange={e => setLink(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium block mb-1">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Display Type</label>
              <Select value={displayType} onValueChange={setDisplayType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="popup">Popup</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><label className="text-sm font-medium block mb-1">Schedule Time (optional)</label><Input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} /></div>
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">{editing ? "Update" : "Create"}</Button>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Announcements</h2><p className="text-muted-foreground">Manage launch banners & popups</p></div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" /> New</Button>
      </div>
      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No announcements yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map(a => (
            <Card key={a.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{a.title}</h3>
                  <Badge variant={a.status === "active" ? "default" : "secondary"}>{a.status}</Badge>
                  <Badge variant="outline">{a.display_type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{a.message}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => startEdit(a)}><Edit2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteItem(a.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

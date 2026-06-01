import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Users, UserPlus, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Channel {
  id: string; name: string; slug: string; description: string | null;
  icon_url: string | null; cover_url: string | null;
  is_public: boolean; is_announcement_only: boolean; member_count: number;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const ChannelManager = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [editing, setEditing] = useState<Channel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [membersDialog, setMembersDialog] = useState<Channel | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", slug: "", description: "", icon_url: "", cover_url: "", is_public: true, is_announcement_only: false });

  const load = async () => {
    const { data } = await supabase.from("channels").select("*").order("created_at", { ascending: false });
    setChannels(data || []);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: "", slug: "", description: "", icon_url: "", cover_url: "", is_public: true, is_announcement_only: false }); setShowForm(true); };
  const openEdit = (c: Channel) => { setEditing(c); setForm({ name: c.name, slug: c.slug, description: c.description || "", icon_url: c.icon_url || "", cover_url: c.cover_url || "", is_public: c.is_public, is_announcement_only: c.is_announcement_only }); setShowForm(true); };

  const save = async () => {
    if (!form.name) return toast.error("Name required");
    const payload = { ...form, slug: form.slug || slugify(form.name) };
    const { error } = editing
      ? await supabase.from("channels").update(payload).eq("id", editing.id)
      : await supabase.from("channels").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Updated" : "Channel created");
    setShowForm(false); load();
  };

  const del = async (id: string) => {
    if (!confirm("Delete this channel and all its messages?")) return;
    const { error } = await supabase.from("channels").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Deleted"); load(); }
  };

  const openMembers = async (c: Channel) => {
    setMembersDialog(c);
    const [{ data: m }, { data: u }] = await Promise.all([
      supabase.from("channel_members").select("*").eq("channel_id", c.id),
      supabase.from("profiles").select("user_id,email,display_name").limit(500),
    ]);
    setMembers(m || []);
    setAllUsers(u || []);
  };

  const addMember = async (userId: string) => {
    if (!membersDialog) return;
    const { error } = await supabase.from("channel_members").insert({ channel_id: membersDialog.id, user_id: userId });
    if (error) toast.error(error.message); else { toast.success("Added"); openMembers(membersDialog); }
  };

  const removeMember = async (id: string) => {
    const { error } = await supabase.from("channel_members").delete().eq("id", id);
    if (error) toast.error(error.message); else if (membersDialog) openMembers(membersDialog);
  };

  const memberIds = new Set(members.map(m => m.user_id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><MessageSquare className="h-6 w-6" />Channels</h2>
          <p className="text-muted-foreground text-sm">Create and manage group chat channels</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" />New Channel</Button>
      </div>

      <Badge variant="secondary">{channels.length} total</Badge>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {channels.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                {c.icon_url ? <img src={c.icon_url} className="h-10 w-10 rounded-full object-cover" /> :
                  <div className="h-10 w-10 rounded-full bg-destructive/20 flex items-center justify-center font-bold">{c.name[0]?.toUpperCase()}</div>}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">/{c.slug}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
              <div className="flex gap-1 flex-wrap">
                <Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" />{c.member_count}</Badge>
                {!c.is_public && <Badge variant="outline" className="text-xs">Private</Badge>}
                {c.is_announcement_only && <Badge variant="outline" className="text-xs">Announce</Badge>}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => openEdit(c)}><Pencil className="h-3 w-3 mr-1" />Edit</Button>
                <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => openMembers(c)}><UserPlus className="h-3 w-3 mr-1" />Members</Button>
                <Button variant="outline" size="sm" className="h-8 text-destructive" onClick={() => del(c.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Channel</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} /></div>
            <div><Label>Slug (URL)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Icon URL</Label><Input value={form.icon_url} onChange={(e) => setForm({ ...form, icon_url: e.target.value })} placeholder="https://..." /></div>
            <div><Label>Cover URL</Label><Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." /></div>
            <div className="flex items-center justify-between"><Label>Public (visible to all)</Label><Switch checked={form.is_public} onCheckedChange={(v) => setForm({ ...form, is_public: v })} /></div>
            <div className="flex items-center justify-between"><Label>Announcement only (admins post)</Label><Switch checked={form.is_announcement_only} onCheckedChange={(v) => setForm({ ...form, is_announcement_only: v })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members */}
      <Dialog open={!!membersDialog} onOpenChange={(o) => !o && setMembersDialog(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Members — {membersDialog?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Current ({members.length})</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto mt-1">
                {members.map(m => {
                  const u = allUsers.find(x => x.user_id === m.user_id);
                  return (
                    <div key={m.id} className="flex items-center justify-between text-sm bg-muted rounded px-2 py-1">
                      <span className="truncate">{u?.display_name || u?.email || m.user_id.slice(0, 8)}</span>
                      <Button variant="ghost" size="sm" className="h-7 text-destructive" onClick={() => removeMember(m.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <Label className="text-xs">Add user</Label>
              <div className="space-y-1 max-h-48 overflow-y-auto mt-1">
                {allUsers.filter(u => !memberIds.has(u.user_id)).map(u => (
                  <div key={u.user_id} className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1">
                    <span className="truncate">{u.display_name || u.email}</span>
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => addMember(u.user_id)}><Plus className="h-3 w-3" /></Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

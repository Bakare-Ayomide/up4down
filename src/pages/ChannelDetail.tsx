import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Lock, Megaphone, Paperclip, LogIn, Trash2, Pin, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Channel {
  id: string; name: string; slug: string; description: string | null;
  icon_url: string | null; cover_url: string | null;
  is_public: boolean; is_announcement_only: boolean; member_count: number;
}
interface Message {
  id: string; channel_id: string; user_id: string; user_display_name: string | null;
  content: string | null; attachment_url: string | null; attachment_type: string | null;
  pinned: boolean; created_at: string;
}

export default function ChannelDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!slug) return;
    const load = async () => {
      setLoading(true);
      const { data: ch } = await supabase.from("channels").select("*").eq("slug", slug).maybeSingle();
      if (!ch) { setLoading(false); return; }
      setChannel(ch);
      const { data: msgs } = await supabase.from("channel_messages").select("*")
        .eq("channel_id", ch.id).order("created_at", { ascending: true }).limit(200);
      setMessages(msgs || []);
      setLoading(false);
    };
    load();
  }, [slug]);

  useEffect(() => {
    if (!channel || !user) { setIsMember(false); setIsAdmin(false); return; }
    (async () => {
      const [{ data: m }, { data: r }] = await Promise.all([
        supabase.from("channel_members").select("id").eq("channel_id", channel.id).eq("user_id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
      ]);
      setIsMember(!!m);
      setIsAdmin(!!r);
    })();
  }, [channel, user]);

  useEffect(() => {
    if (!channel) return;
    const ch = supabase.channel(`channel-${channel.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "channel_messages", filter: `channel_id=eq.${channel.id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message]))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "channel_messages", filter: `channel_id=eq.${channel.id}` },
        (payload) => setMessages((prev) => prev.filter(m => m.id !== (payload.old as any).id)))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "channel_messages", filter: `channel_id=eq.${channel.id}` },
        (payload) => setMessages((prev) => prev.map(m => m.id === (payload.new as any).id ? payload.new as Message : m)))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [channel]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const join = async () => {
    if (!user) return navigate("/auth");
    if (!channel) return;
    const { error } = await supabase.from("channel_members").insert({ channel_id: channel.id, user_id: user.id });
    if (error) toast.error(error.message); else { setIsMember(true); toast.success("Joined!"); }
  };

  const leave = async () => {
    if (!user || !channel) return;
    await supabase.from("channel_members").delete().eq("channel_id", channel.id).eq("user_id", user.id);
    setIsMember(false);
    toast.success("Left channel");
  };

  const send = async () => {
    if (!user || !channel) return;
    if (!input.trim() && !file) return;
    setSending(true);
    try {
      let attachment_url: string | null = null;
      let attachment_type: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("channel-media").upload(path, file);
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("channel-media").getPublicUrl(path);
        attachment_url = data.publicUrl;
        attachment_type = file.type.startsWith("image/") ? "image" : "file";
      }
      const { data: profile } = await supabase.from("profiles").select("display_name,email").eq("user_id", user.id).maybeSingle();
      const { error } = await supabase.from("channel_messages").insert({
        channel_id: channel.id, user_id: user.id,
        user_display_name: profile?.display_name || profile?.email || "User",
        content: input.trim() || null, attachment_url, attachment_type,
      });
      if (error) throw error;
      setInput(""); setFile(null);
    } catch (e: any) { toast.error(e.message); } finally { setSending(false); }
  };

  const deleteMsg = async (id: string) => {
    await supabase.from("channel_messages").delete().eq("id", id);
  };

  const togglePin = async (m: Message) => {
    await supabase.from("channel_messages").update({ pinned: !m.pinned }).eq("id", m.id);
  };

  if (loading) return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center">Loading...</div></div>;
  if (!channel) return <div className="min-h-screen flex flex-col"><Navbar /><div className="flex-1 flex items-center justify-center">Channel not found</div></div>;

  const canPost = user && (isAdmin || (isMember && !channel.is_announcement_only));
  const pinned = messages.filter(m => m.pinned);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-0 sm:px-4 py-0 sm:py-4 flex flex-col max-w-4xl w-full">
        <Card className="flex-1 flex flex-col overflow-hidden rounded-none sm:rounded-lg">
          {/* Header */}
          <div className="border-b p-3 flex items-center gap-3 bg-card/80 backdrop-blur">
            <Button variant="ghost" size="icon" asChild className="shrink-0">
              <Link to="/channels"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            {channel.icon_url ? (
              <img src={channel.icon_url} className="h-10 w-10 rounded-full object-cover" alt="" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-destructive to-destructive/60 flex items-center justify-center text-white font-bold">
                {channel.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold truncate">{channel.name}</h2>
                {!channel.is_public && <Lock className="h-3 w-3 text-muted-foreground" />}
                {channel.is_announcement_only && <Badge variant="outline" className="gap-1 text-xs"><Megaphone className="h-3 w-3" />Announcement</Badge>}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{channel.member_count} members</p>
            </div>
            {user && (isMember ? (
              <Button variant="outline" size="sm" onClick={leave}>Leave</Button>
            ) : (
              <Button size="sm" onClick={join} className="gap-1"><LogIn className="h-3 w-3" />Join</Button>
            ))}
          </div>

          {/* Pinned */}
          {pinned.length > 0 && (
            <div className="border-b bg-muted/40 p-2 text-xs space-y-1 max-h-24 overflow-y-auto">
              {pinned.map(m => (
                <div key={m.id} className="flex items-center gap-2"><Pin className="h-3 w-3 text-destructive shrink-0" /><span className="truncate"><b>{m.user_display_name}:</b> {m.content}</span></div>
              ))}
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[50vh]">
            {messages.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No messages yet. Be the first!</p>}
            {messages.map((m) => {
              const own = user?.id === m.user_id;
              return (
                <div key={m.id} className={`flex gap-2 group ${own ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="text-xs bg-muted">{(m.user_display_name || "?").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] ${own ? "items-end" : "items-start"} flex flex-col`}>
                    <div className="text-xs text-muted-foreground px-1">{m.user_display_name} · {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    <div className={`rounded-2xl px-3 py-2 ${own ? "bg-destructive text-destructive-foreground" : "bg-muted"}`}>
                      {m.attachment_url && m.attachment_type === "image" && (
                        <a href={m.attachment_url} target="_blank" rel="noopener"><img src={m.attachment_url} className="max-w-xs rounded mb-1" alt="" /></a>
                      )}
                      {m.attachment_url && m.attachment_type !== "image" && (
                        <a href={m.attachment_url} target="_blank" rel="noopener" className="flex items-center gap-1 underline"><Paperclip className="h-3 w-3" />Attachment</a>
                      )}
                      {m.content && <p className="whitespace-pre-wrap break-words text-sm">{m.content}</p>}
                    </div>
                    {(own || isAdmin) && (
                      <div className="opacity-0 group-hover:opacity-100 flex gap-1 mt-1">
                        {isAdmin && <button onClick={() => togglePin(m)} className="text-xs text-muted-foreground hover:text-foreground"><Pin className="h-3 w-3" /></button>}
                        <button onClick={() => deleteMsg(m.id)} className="text-xs text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Composer */}
          <div className="border-t p-3 bg-card">
            {!user ? (
              <Button asChild className="w-full"><Link to="/auth">Sign in to chat</Link></Button>
            ) : !canPost ? (
              <p className="text-center text-sm text-muted-foreground">
                {channel.is_announcement_only ? "Only admins can post here" : "Join the channel to post"}
              </p>
            ) : (
              <div className="space-y-2">
                {file && (
                  <div className="flex items-center gap-2 text-xs bg-muted rounded px-2 py-1">
                    <Paperclip className="h-3 w-3" /><span className="truncate flex-1">{file.name}</span>
                    <button onClick={() => setFile(null)}><X className="h-3 w-3" /></button>
                  </div>
                )}
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    <Button variant="outline" size="icon" asChild><span><Paperclip className="h-4 w-4" /></span></Button>
                  </label>
                  <Input value={input} onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Type a message..." disabled={sending} />
                  <Button onClick={send} disabled={sending || (!input.trim() && !file)} size="icon"><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}

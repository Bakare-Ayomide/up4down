import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Upload, Image, X } from "lucide-react";

interface MediaAsset {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
  created_at: string;
}

export const MediaAssetsManager = () => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("screenshot");
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false });
    if (data) setAssets(data as any);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("media-assets").upload(path, file);
    if (error) { toast.error("Upload failed"); setUploading(false); return; }
    const { data } = supabase.storage.from("media-assets").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
    toast.success("Uploaded!");
  };

  const handleSave = async () => {
    if (!title || !imageUrl) { toast.error("Title and image required"); return; }
    await supabase.from("media_assets").insert({ title, description: description || null, image_url: imageUrl, category } as any);
    toast.success("Added!");
    setTitle(""); setDescription(""); setImageUrl(""); setCategory("screenshot"); setShowForm(false);
    fetch();
  };

  const deleteAsset = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("media_assets").delete().eq("id", id);
    toast.success("Deleted"); fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Media Assets</h2><p className="text-muted-foreground">Screenshots, banners & promo materials</p></div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2"><Plus className="h-4 w-4" /> Add</Button>
      </div>

      {showForm && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between"><h3 className="font-semibold">New Media Asset</h3><Button variant="ghost" size="icon" onClick={() => setShowForm(false)}><X className="h-4 w-4" /></Button></div>
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
          <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)" />
          <div className="flex gap-2">
            <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Image URL or upload" className="flex-1" />
            <label className="cursor-pointer">
              <Button variant="outline" className="gap-2" asChild disabled={uploading}>
                <span><Upload className="h-4 w-4" />{uploading ? "..." : "Upload"}</span>
              </Button>
              <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
          </div>
          {imageUrl && <img src={imageUrl} alt="" className="max-h-32 rounded-lg object-contain" />}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="screenshot">Screenshot</SelectItem>
              <SelectItem value="banner">Banner</SelectItem>
              <SelectItem value="promo">Promo</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSave}>Save</Button>
        </Card>
      )}

      {assets.length === 0 ? (
        <Card className="p-12 text-center"><Image className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">No media assets yet</p></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.map(a => (
            <Card key={a.id} className="overflow-hidden group">
              <img src={a.image_url} alt={a.title} className="w-full h-32 object-cover" />
              <div className="p-3">
                <h4 className="font-semibold text-sm truncate">{a.title}</h4>
                <span className="text-xs text-muted-foreground capitalize">{a.category}</span>
                <Button variant="ghost" size="sm" onClick={() => deleteAsset(a.id)} className="text-destructive ml-auto block mt-1">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, Loader2, Edit2, Folder } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export const CategoryManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    if (data) setCategories(data);
    setLoading(false);
  };

  const resetForm = () => {
    setName(""); setSlug(""); setIcon("");
    setEditing(null); setShowForm(false);
  };

  const startEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon || "");
    setShowForm(true);
  };

  const generateSlug = (value: string) => {
    setName(value);
    if (!editing) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  };

  const handleSave = async () => {
    if (!name || !slug) { toast.error("Name and slug are required"); return; }
    setSaving(true);

    if (editing) {
      const { error } = await supabase.from("categories").update({ name, slug, icon: icon || null }).eq("id", editing.id);
      if (error) toast.error(error.message);
      else { toast.success("Category updated"); resetForm(); fetchCategories(); }
    } else {
      const { error } = await supabase.from("categories").insert({ name, slug, icon: icon || null });
      if (error) toast.error(error.message);
      else { toast.success("Category created"); resetForm(); fetchCategories(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    // Delete related item_categories first
    await supabase.from("download_item_categories").delete().eq("category_id", deleteId);
    await supabase.from("categories").delete().eq("id", deleteId);
    toast.success("Category deleted");
    setDeleteId(null);
    fetchCategories();
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{editing ? "Edit Category" : "New Category"}</h2>
          <Button variant="outline" onClick={resetForm}>Cancel</Button>
        </div>
        <Card className="p-6 space-y-4">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => generateSlug(e.target.value)} placeholder="e.g. Exploit" className="mt-1" />
          </div>
          <div>
            <Label>Slug *</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. exploit" className="mt-1" />
          </div>
          <div>
            <Label>Icon (emoji or text)</Label>
            <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. 🔓" className="mt-1" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editing ? "Update" : "Create"}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Categories</h2>
          <p className="text-muted-foreground">Manage download categories</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Category
        </Button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid gap-3">
          {categories.map((cat) => (
            <Card key={cat.id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    {cat.icon ? <span className="text-lg">{cat.icon}</span> : <Folder className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{cat.name}</h3>
                    <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => startEdit(cat)} className="gap-1">
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(cat.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {categories.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No categories yet.</div>
          )}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>Items using this category will be unlinked. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

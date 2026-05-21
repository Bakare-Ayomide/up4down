import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2, Eye, Star, Package } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AdminItemListProps {
  onEdit: (item: any) => void;
}

type ConfirmMode = null | { type: "single"; id: string } | { type: "bulk"; ids: string[] } | { type: "all" };

export const AdminItemList = ({ onEdit }: AdminItemListProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmMode>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("download_items")
      .select(`
        *,
        download_item_categories(
          categories(name, slug)
        )
      `)
      .order("created_at", { ascending: false });

    if (data) setItems(data);
    setSelected(new Set());
    setLoading(false);
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.id)));
  };

  const handleDelete = async () => {
    if (!confirm) return;
    try {
      let ids: string[] = [];
      if (confirm.type === "single") ids = [confirm.id];
      else if (confirm.type === "bulk") ids = confirm.ids;
      else if (confirm.type === "all") ids = items.map((i) => i.id);

      if (ids.length === 0) return;

      const { error } = await supabase.from("download_items").delete().in("id", ids);
      if (error) throw error;

      toast.success(`Deleted ${ids.length} item${ids.length > 1 ? "s" : ""}`);
      fetchItems();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    } finally {
      setConfirm(null);
    }
  };

  if (loading) return <p>Loading...</p>;

  const allChecked = items.length > 0 && selected.size === items.length;

  return (
    <>
      {/* Stats + Bulk toolbar */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Package className="h-4 w-4 text-primary" />
          <span className="font-semibold">Total Items: {items.length}</span>
          {selected.size > 0 && (
            <Badge variant="secondary" className="ml-2">{selected.size} selected</Badge>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {allChecked ? "Unselect All" : "Select All"}
            </Button>
          )}
          {selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirm({ type: "bulk", ids: Array.from(selected) })}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Selected ({selected.size})
            </Button>
          )}
          {items.length > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setConfirm({ type: "all" })}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete All
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="p-3 flex flex-col">
            <div className="flex items-start gap-2 min-w-0">
              <Checkbox
                checked={selected.has(item.id)}
                onCheckedChange={() => toggleOne(item.id)}
                className="mt-1 shrink-0"
              />
              {item.thumbnail_url && (
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  className="h-12 w-12 object-cover rounded shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  {item.download_item_categories?.slice(0, 2).map((dic: any) => (
                    <Badge key={dic.categories.slug} variant="secondary" className="text-[10px] px-1.5 py-0">
                      {dic.categories.name}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">{(item.file_type || "").toUpperCase()}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {Number(item.download_count ?? 0).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {Number(item.average_rating ?? 0).toFixed(1)} ({Number(item.rating_count ?? 0)})
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => onEdit(item)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
              <Button variant="outline" size="sm" className="flex-1 h-8 text-destructive hover:text-destructive" onClick={() => setConfirm({ type: "single", id: item.id })}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
            </div>
          </Card>
        ))}

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items yet. Create your first download!</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.type === "all" && `This will permanently delete ALL ${items.length} download items. This action cannot be undone.`}
              {confirm?.type === "bulk" && `This will permanently delete ${confirm.ids.length} selected items. This action cannot be undone.`}
              {confirm?.type === "single" && `This will permanently delete the download item. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

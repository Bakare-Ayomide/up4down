import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Eye, Star } from "lucide-react";
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

export const AdminItemList = ({ onEdit }: AdminItemListProps) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

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
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from("download_items").delete().eq("id", deleteId);

      if (error) throw error;

      toast.success("Item deleted successfully");
      fetchItems();
    } catch (error) {
      toast.error("Failed to delete item");
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="p-3">
            <div className="flex items-start gap-3">
              {item.thumbnail_url && (
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  className="h-12 w-12 sm:h-16 sm:w-16 object-cover rounded shrink-0"
                />
              )}

              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm sm:text-base truncate">{item.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {item.download_item_categories?.map((dic: any) => (
                        <Badge key={dic.categories.slug} variant="secondary" className="text-xs px-1.5 py-0">
                          {dic.categories.name}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-xs px-1.5 py-0">{(item.file_type || "").toUpperCase()}</Badge>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setDeleteId(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
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
          </Card>
        ))}

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items yet. Create your first download!</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the download item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

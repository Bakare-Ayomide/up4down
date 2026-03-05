import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, X, HelpCircle } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
}

export const FAQManager = () => {
  const [items, setItems] = useState<FAQ[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [published, setPublished] = useState(true);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("faq_entries").select("*").order("sort_order");
    if (data) setItems(data as any);
  };

  const resetForm = () => {
    setQuestion(""); setAnswer(""); setSortOrder(0); setPublished(true);
    setEditing(null); setShowForm(false);
  };

  const startEdit = (f: FAQ) => {
    setEditing(f); setQuestion(f.question); setAnswer(f.answer);
    setSortOrder(f.sort_order); setPublished(f.published); setShowForm(true);
  };

  const handleSave = async () => {
    if (!question) { toast.error("Question required"); return; }
    const payload: any = { question, answer, sort_order: sortOrder, published };
    if (editing) {
      await supabase.from("faq_entries").update(payload).eq("id", editing.id);
      toast.success("Updated!");
    } else {
      await supabase.from("faq_entries").insert(payload);
      toast.success("Created!");
    }
    resetForm(); fetch();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("faq_entries").delete().eq("id", id);
    toast.success("Deleted"); fetch();
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{editing ? "Edit" : "Add"} FAQ</h2>
          <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-5 w-5" /></Button>
        </div>
        <Card className="p-6 space-y-4">
          <div><label className="text-sm font-medium block mb-1">Question *</label><Input value={question} onChange={e => setQuestion(e.target.value)} /></div>
          <div><label className="text-sm font-medium block mb-1">Answer</label><Textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={4} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium block mb-1">Sort Order</label><Input type="number" value={sortOrder} onChange={e => setSortOrder(parseInt(e.target.value) || 0)} /></div>
            <div className="flex items-center gap-2 pt-6"><Switch checked={published} onCheckedChange={setPublished} /><label className="text-sm">Published</label></div>
          </div>
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
        <div><h2 className="text-2xl font-bold">FAQ Manager</h2><p className="text-muted-foreground">Manage support FAQs</p></div>
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus className="h-4 w-4" /> Add FAQ</Button>
      </div>
      {items.length === 0 ? (
        <Card className="p-12 text-center"><HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" /><p className="text-muted-foreground">No FAQs yet</p></Card>
      ) : (
        <div className="space-y-2">
          {items.map(f => (
            <Card key={f.id} className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-semibold">{f.question}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{f.answer}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => startEdit(f)}><Edit2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => deleteItem(f.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

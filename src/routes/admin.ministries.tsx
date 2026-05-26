import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadToMedia } from "@/lib/upload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { canDelete } from "@/lib/admin-permissions";
import { useAdminRole } from "@/hooks/use-admin-role";

export const Route = createFileRoute("/admin/ministries")({ component: MinistriesAdmin });

type Ministry = {
  id: string; title: string; description: string | null;
  image_url: string | null; display_order: number; is_published: boolean;
};

const empty = { title: "", description: "", image_url: "", display_order: 0, is_published: true };

function MinistriesAdmin() {
  const qc = useQueryClient();
  const { role } = useAdminRole();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ministry | null>(null);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-ministries"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ministries").select("*").order("display_order");
      if (error) throw error;
      return data as Ministry[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = { ...form, description: form.description || null, image_url: form.image_url || null };
      if (editing) {
        const { error } = await supabase.from("ministries").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ministries").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ministries"] });
      toast.success(editing ? "Updated" : "Created");
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ministries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ministries"] }); toast.success("Deleted"); },
  });

  const handleFile = async (f: File) => {
    setUploading(true);
    try { const url = await uploadToMedia(f, "ministries"); setForm((s) => ({ ...s, image_url: url })); toast.success("Uploaded"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  };

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (m: Ministry) => {
    setEditing(m);
    setForm({ title: m.title, description: m.description ?? "", image_url: m.image_url ?? "", display_order: m.display_order, is_published: m.is_published });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Ministries</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New Ministry</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Ministry</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }} className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={150} /></div>
              <div><Label>Description</Label><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={2000} /></div>
              <div>
                <Label>Image</Label>
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} disabled={uploading} />
                {form.image_url && <img src={form.image_url} alt="" className="mt-2 h-32 w-full object-cover rounded" />}
                <Input className="mt-2" placeholder="…or paste image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} maxLength={500} />
              </div>
              <div><Label>Display order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
              <Button type="submit" disabled={upsert.isPending || uploading} className="w-full">{upsert.isPending ? "Saving…" : "Save"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="grid sm:grid-cols-2 gap-3">
        {data?.map((m) => (
          <Card key={m.id} className="p-5">
            {m.image_url && <img src={m.image_url} alt={m.title} className="h-32 w-full object-cover rounded mb-3" />}
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{m.title}</h3>
                  {!m.is_published && <span className="text-xs bg-muted px-2 py-0.5 rounded">Draft</span>}
                </div>
                {m.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{m.description}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => openEdit(m)}><Pencil className="h-4 w-4" /></Button>
                {canDelete(role) && <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete?")) remove.mutate(m.id); }}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </div>
          </Card>
        ))}
        {data && data.length === 0 && <p className="text-muted-foreground">No ministries yet.</p>}
      </div>
    </div>
  );
}

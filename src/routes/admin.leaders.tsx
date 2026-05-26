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

export const Route = createFileRoute("/admin/leaders")({ component: LeadersAdmin });

type Leader = {
  id: string; name: string; role: string; bio: string | null;
  photo_url: string | null; display_order: number; is_published: boolean;
};

const empty = { name: "", role: "", bio: "", photo_url: "", display_order: 0, is_published: true };

function LeadersAdmin() {
  const qc = useQueryClient();
  const { role } = useAdminRole();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Leader | null>(null);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-leaders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leaders").select("*").order("display_order");
      if (error) throw error;
      return data as Leader[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = { ...form, bio: form.bio || null, photo_url: form.photo_url || null };
      if (editing) {
        const { error } = await supabase.from("leaders").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("leaders").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-leaders"] });
      toast.success(editing ? "Updated" : "Created");
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leaders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-leaders"] }); toast.success("Deleted"); },
  });

  const handleFile = async (f: File) => {
    setUploading(true);
    try { const url = await uploadToMedia(f, "leaders"); setForm((s) => ({ ...s, photo_url: url })); toast.success("Uploaded"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  };

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (l: Leader) => {
    setEditing(l);
    setForm({ name: l.name, role: l.role, bio: l.bio ?? "", photo_url: l.photo_url ?? "", display_order: l.display_order, is_published: l.is_published });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Leadership</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New Leader</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Leader</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }} className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={150} /></div>
              <div><Label>Role</Label><Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required maxLength={200} /></div>
              <div><Label>Bio</Label><Textarea rows={5} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={2000} /></div>
              <div>
                <Label>Photo</Label>
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} disabled={uploading} />
                {form.photo_url && <img src={form.photo_url} alt="" className="mt-2 h-24 w-24 rounded-full object-cover" />}
                <Input className="mt-2" placeholder="…or paste image URL" value={form.photo_url} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} maxLength={500} />
              </div>
              <div><Label>Display order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
              <Button type="submit" disabled={upsert.isPending || uploading} className="w-full">{upsert.isPending ? "Saving…" : "Save"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="space-y-3">
        {data?.map((l) => (
          <Card key={l.id} className="p-5">
            <div className="flex gap-4 items-start flex-wrap">
              {l.photo_url ? <img src={l.photo_url} alt={l.name} className="h-16 w-16 rounded-full object-cover" />
                : <div className="h-16 w-16 rounded-full bg-muted grid place-items-center font-bold">{l.name[0]}</div>}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{l.name}</h3>
                  {!l.is_published && <span className="text-xs bg-muted px-2 py-0.5 rounded">Draft</span>}
                </div>
                <p className="text-sm text-primary">{l.role}</p>
                {l.bio && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{l.bio}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(l)}><Pencil className="h-4 w-4" /></Button>
                {canDelete(role) && <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete?")) remove.mutate(l.id); }}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </div>
          </Card>
        ))}
        {data && data.length === 0 && <p className="text-muted-foreground">No leaders yet.</p>}
      </div>
    </div>
  );
}

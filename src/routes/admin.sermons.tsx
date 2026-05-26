import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { uploadToMedia } from "@/lib/upload";
import { canDelete } from "@/lib/admin-permissions";
import { useAdminRole } from "@/hooks/use-admin-role";

export const Route = createFileRoute("/admin/sermons")({
  component: SermonsAdmin,
});

type Sermon = {
  id: string;
  title: string;
  speaker: string;
  date: string;
  description: string | null;
  youtube_url: string | null;
  external_link: string | null;
  audio_url: string | null;
  is_published: boolean;
};

const empty: Omit<Sermon, "id"> = {
  title: "", speaker: "", date: new Date().toISOString().slice(0, 10),
  description: "", youtube_url: "", external_link: "", audio_url: "", is_published: true,
};

function SermonsAdmin() {
  const qc = useQueryClient();
  const { role } = useAdminRole();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Sermon | null>(null);
  const [form, setForm] = useState<Omit<Sermon, "id">>(empty);
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-sermons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sermons").select("*").order("date", { ascending: false });
      if (error) throw error;
      return data as Sermon[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = { ...form, description: form.description || null, youtube_url: form.youtube_url || null, external_link: form.external_link || null, audio_url: form.audio_url || null };
      if (editing) {
        const { error } = await supabase.from("sermons").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sermons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sermons"] });
      toast.success(editing ? "Updated" : "Created");
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sermons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-sermons"] }); toast.success("Deleted"); },
  });

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Sermon) => {
    setEditing(s);
    setForm({
      title: s.title, speaker: s.speaker, date: s.date,
      description: s.description ?? "", youtube_url: s.youtube_url ?? "",
      external_link: s.external_link ?? "", audio_url: s.audio_url ?? "", is_published: s.is_published,
    });
    setOpen(true);
  };

  const handleAudio = async (f: File) => {
    setUploading(true);
    try { const url = await uploadToMedia(f, "sermons"); setForm((s) => ({ ...s, audio_url: url })); toast.success("Audio uploaded"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Sermons</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New Sermon</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Sermon</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }} className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={200} /></div>
              <div><Label>Speaker</Label><Input value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })} required maxLength={100} /></div>
              <div><Label>Date</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
              <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} /></div>
              <div><Label>YouTube embed URL</Label><Input value={form.youtube_url ?? ""} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} placeholder="https://www.youtube.com/embed/..." maxLength={500} /></div>
              <div><Label>External link</Label><Input value={form.external_link ?? ""} onChange={(e) => setForm({ ...form, external_link: e.target.value })} maxLength={500} /></div>
              <div>
                <Label>Audio file (optional)</Label>
                <Input type="file" accept="audio/*" onChange={(e) => e.target.files?.[0] && handleAudio(e.target.files[0])} disabled={uploading} />
                {form.audio_url && <audio controls src={form.audio_url} className="mt-2 w-full" />}
                <Input className="mt-2" placeholder="…or paste audio URL" value={form.audio_url ?? ""} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} maxLength={500} />
              </div>
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
              <Button type="submit" disabled={upsert.isPending || uploading} className="w-full">{upsert.isPending ? "Saving…" : "Save"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="space-y-3">
        {data?.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{s.title}</h3>
                  {!s.is_published && <span className="text-xs bg-muted px-2 py-0.5 rounded">Draft</span>}
                </div>
                <p className="text-sm text-muted-foreground">{s.speaker} · {s.date}</p>
                {s.description && <p className="mt-2 text-sm line-clamp-2">{s.description}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                {canDelete(role) && <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete?")) remove.mutate(s.id); }}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </div>
          </Card>
        ))}
        {data && data.length === 0 && <p className="text-muted-foreground">No sermons yet. Click "New Sermon" to add one.</p>}
      </div>
    </div>
  );
}

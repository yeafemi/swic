import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadToMedia } from "@/lib/upload";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { canDelete } from "@/lib/admin-permissions";
import { useAdminRole } from "@/hooks/use-admin-role";

export const Route = createFileRoute("/admin/gallery")({ component: GalleryAdmin });

const CATEGORIES = ["Services", "Conferences", "Outreach", "Youth Events"] as const;
type Category = typeof CATEGORIES[number];

type Img = { id: string; title: string | null; image_url: string; category: Category; is_published: boolean; created_at: string };

function GalleryAdmin() {
  const qc = useQueryClient();
  const { role } = useAdminRole();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"All" | Category>("All");
  const [form, setForm] = useState<{ title: string; category: Category; image_url: string }>({ title: "", category: "Services", image_url: "" });
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_images").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Img[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.image_url) throw new Error("Upload or paste an image URL first");
      const { error } = await supabase.from("gallery_images").insert({
        title: form.title || null, category: form.category, image_url: form.image_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      toast.success("Image added");
      setOpen(false); setForm({ title: "", category: "Services", image_url: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("gallery_images").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-gallery"] }); toast.success("Deleted"); },
  });

  const handleFile = async (f: File) => {
    setUploading(true);
    try { const url = await uploadToMedia(f, "gallery"); setForm((s) => ({ ...s, image_url: url })); toast.success("Uploaded"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  };

  const filtered = data?.filter((i) => filter === "All" || i.category === filter) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Gallery</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Upload Image</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>New Gallery Image</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
              <div>
                <Label>Image file</Label>
                <Input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} disabled={uploading} />
                {form.image_url && <img src={form.image_url} alt="" className="mt-2 h-40 w-full object-cover rounded" />}
                <Input className="mt-2" placeholder="…or paste image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} maxLength={500} />
              </div>
              <div><Label>Caption (optional)</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={200} /></div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as Category })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={create.isPending || uploading} className="w-full">{create.isPending ? "Saving…" : "Save"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["All", ...CATEGORIES] as const).map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === c ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
            {c}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((i) => (
          <Card key={i.id} className="overflow-hidden">
            <img src={i.image_url} alt={i.title ?? ""} className="aspect-square w-full object-cover" />
            <div className="p-3 flex justify-between items-start gap-2">
              <div className="min-w-0">
                <div className="text-xs text-primary font-semibold">{i.category}</div>
                {i.title && <div className="text-sm truncate">{i.title}</div>}
              </div>
              {canDelete(role) && (
                <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) remove.mutate(i.id); }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </Card>
        ))}
        {!isLoading && filtered.length === 0 && <p className="text-muted-foreground col-span-full">No images yet.</p>}
      </div>
    </div>
  );
}

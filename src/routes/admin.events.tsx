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
import { canDelete } from "@/lib/admin-permissions";
import { useAdminRole } from "@/hooks/use-admin-role";

export const Route = createFileRoute("/admin/events")({
  component: EventsAdmin,
});

type Event = {
  id: string;
  name: string;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  description: string | null;
  is_ongoing: boolean;
  is_published: boolean;
};

const empty = {
  name: "", event_date: "", event_time: "", venue: "",
  description: "", is_ongoing: false, is_published: true,
};

function EventsAdmin() {
  const qc = useQueryClient();
  const { role } = useAdminRole();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState(empty);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("event_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as Event[];
    },
  });

  const upsert = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        event_date: form.event_date || null,
        event_time: form.event_time || null,
        venue: form.venue || null,
        description: form.description || null,
      };
      if (editing) {
        const { error } = await supabase.from("events").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("events").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-events"] });
      toast.success(editing ? "Updated" : "Created");
      setOpen(false); setEditing(null); setForm(empty);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); toast.success("Deleted"); },
  });

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (e: Event) => {
    setEditing(e);
    setForm({
      name: e.name, event_date: e.event_date ?? "", event_time: e.event_time ?? "",
      venue: e.venue ?? "", description: e.description ?? "",
      is_ongoing: e.is_ongoing, is_published: e.is_published,
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Events</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New Event</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} Event</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); upsert.mutate(); }} className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={200} /></div>
              <div><Label>Date</Label><Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} /></div>
              <div><Label>Time</Label><Input value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} placeholder="6:30 PM" maxLength={100} /></div>
              <div><Label>Venue</Label><Input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} maxLength={200} /></div>
              <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_ongoing} onCheckedChange={(v) => setForm({ ...form, is_ongoing: v })} /><Label>Ongoing event</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_published} onCheckedChange={(v) => setForm({ ...form, is_published: v })} /><Label>Published</Label></div>
              <Button type="submit" disabled={upsert.isPending} className="w-full">{upsert.isPending ? "Saving…" : "Save"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="space-y-3">
        {data?.map((e) => (
          <Card key={e.id} className="p-5">
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{e.name}</h3>
                  {e.is_ongoing && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Ongoing</span>}
                  {!e.is_published && <span className="text-xs bg-muted px-2 py-0.5 rounded">Draft</span>}
                </div>
                <p className="text-sm text-muted-foreground">{[e.event_date, e.event_time, e.venue].filter(Boolean).join(" · ")}</p>
                {e.description && <p className="mt-2 text-sm line-clamp-2">{e.description}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                {canDelete(role) && <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete?")) remove.mutate(e.id); }}><Trash2 className="h-4 w-4" /></Button>}
              </div>
            </div>
          </Card>
        ))}
        {data && data.length === 0 && <p className="text-muted-foreground">No events yet.</p>}
      </div>
    </div>
  );
}

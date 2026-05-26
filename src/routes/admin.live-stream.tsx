import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/live-stream")({
  component: LiveStreamAdmin,
});

type LiveStream = {
  id: boolean;
  title: string;
  description: string | null;
  embed_url: string;
  youtube_url: string | null;
  zoom_url: string | null;
  schedule_note: string | null;
  is_live: boolean;
  is_published: boolean;
};

const fallback: LiveStream = {
  id: true,
  title: "SWIC Live",
  description: "",
  embed_url: "https://www.youtube.com/embed/live_stream?channel=UCsoulwinnersic",
  youtube_url: "",
  zoom_url: "",
  schedule_note: "",
  is_live: false,
  is_published: true,
};

function LiveStreamAdmin() {
  const qc = useQueryClient();
  const [form, setForm] = useState<LiveStream>(fallback);

  const { isLoading } = useQuery({
    queryKey: ["admin-live-stream"],
    queryFn: async () => {
      const { data, error } = await supabase.from("live_stream_settings").select("*").eq("id", true).maybeSingle();
      if (error) throw error;
      const next = (data as LiveStream | null) ?? fallback;
      setForm({
        ...next,
        description: next.description ?? "",
        youtube_url: next.youtube_url ?? "",
        zoom_url: next.zoom_url ?? "",
        schedule_note: next.schedule_note ?? "",
      });
      return next;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        id: true,
        title: form.title,
        description: form.description || null,
        embed_url: form.embed_url,
        youtube_url: form.youtube_url || null,
        zoom_url: form.zoom_url || null,
        schedule_note: form.schedule_note || null,
        is_live: form.is_live,
        is_published: form.is_published,
      };
      const { error } = await supabase.from("live_stream_settings").upsert(payload).eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-live-stream"] });
      toast.success("Live stream settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Live Stream</h1>
        <p className="text-muted-foreground mt-1">Manage the live stream title, embed, and joining links.</p>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-5">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required maxLength={200} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
            </div>
            <div>
              <Label>Embed URL</Label>
              <Input value={form.embed_url} onChange={(e) => setForm({ ...form, embed_url: e.target.value })} required maxLength={500} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>YouTube link</Label>
                <Input value={form.youtube_url ?? ""} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} maxLength={500} />
              </div>
              <div>
                <Label>Zoom link</Label>
                <Input value={form.zoom_url ?? ""} onChange={(e) => setForm({ ...form, zoom_url: e.target.value })} maxLength={500} />
              </div>
            </div>
            <div>
              <Label>Schedule note</Label>
              <Textarea value={form.schedule_note ?? ""} onChange={(e) => setForm({ ...form, schedule_note: e.target.value })} maxLength={1000} />
            </div>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.is_live} onCheckedChange={(value) => setForm({ ...form, is_live: value })} />
                Live now
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={form.is_published} onCheckedChange={(value) => setForm({ ...form, is_published: value })} />
                Published
              </label>
            </div>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Saving..." : "Save changes"}</Button>
          </form>
        )}
      </Card>
    </div>
  );
}

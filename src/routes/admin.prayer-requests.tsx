import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { canDelete } from "@/lib/admin-permissions";
import { useAdminRole } from "@/hooks/use-admin-role";

export const Route = createFileRoute("/admin/prayer-requests")({
  component: PrayerRequestsAdmin,
});

function PrayerRequestsAdmin() {
  const qc = useQueryClient();
  const { role } = useAdminRole();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-prayer-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("prayer_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const togglePrayed = useMutation({
    mutationFn: async ({ id, prayed }: { id: string; prayed: boolean }) => {
      const { error } = await supabase.from("prayer_requests").update({ prayed_for: prayed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-prayer-requests"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("prayer_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-prayer-requests"] });
      toast.success("Deleted");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Prayer Requests</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="space-y-3">
        {data?.map((p) => (
          <Card key={p.id} className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{p.is_anonymous ? "Anonymous" : p.name}</span>
                  {p.email && !p.is_anonymous && <span className="text-sm text-muted-foreground">· {p.email}</span>}
                  {p.prayed_for ? <Badge variant="secondary">Prayed for</Badge> : <Badge>New</Badge>}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{p.request}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => togglePrayed.mutate({ id: p.id, prayed: !p.prayed_for })}>
                  <Check className="h-4 w-4 mr-1" />{p.prayed_for ? "Mark new" : "Mark prayed"}
                </Button>
                {canDelete(role) && (
                  <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete?")) remove.mutate(p.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {data && data.length === 0 && <p className="text-muted-foreground">No prayer requests yet.</p>}
      </div>
    </div>
  );
}

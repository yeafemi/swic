import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { canDelete } from "@/lib/admin-permissions";
import { useAdminRole } from "@/hooks/use-admin-role";

export const Route = createFileRoute("/admin/subscribers")({
  component: SubscribersAdmin,
});

function SubscribersAdmin() {
  const qc = useQueryClient();
  const { role } = useAdminRole();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("newsletter_subscribers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-subscribers"] });
      toast.success("Removed");
    },
  });

  const exportCsv = () => {
    if (!data) return;
    const csv = ["email,subscribed_at", ...data.map((s) => `${s.email},${s.created_at}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "subscribers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h1 className="text-3xl font-bold">Subscribers</h1>
        <Button onClick={exportCsv} disabled={!data?.length}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
      </div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <Card className="divide-y">
        {data?.map((s) => (
          <div key={s.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium">{s.email}</p>
              <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleString()}</p>
            </div>
            {canDelete(role) && (
              <Button size="sm" variant="ghost" onClick={() => { if (confirm("Remove?")) remove.mutate(s.id); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {data && data.length === 0 && <p className="p-6 text-muted-foreground">No subscribers yet.</p>}
      </Card>
    </div>
  );
}

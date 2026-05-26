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

export const Route = createFileRoute("/admin/messages")({
  component: MessagesAdmin,
});

function MessagesAdmin() {
  const qc = useQueryClient();
  const { role } = useAdminRole();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleRead = useMutation({
    mutationFn: async ({ id, read }: { id: string; read: boolean }) => {
      const { error } = await supabase.from("contact_messages").update({ is_read: read }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-messages"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contact_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-messages"] });
      toast.success("Deleted");
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Contact Messages</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="space-y-3">
        {data?.map((m) => (
          <Card key={m.id} className={`p-5 ${!m.is_read ? "border-primary/40" : ""}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{m.name}</span>
                  <a href={`mailto:${m.email}`} className="text-sm text-primary hover:underline">{m.email}</a>
                  {!m.is_read && <Badge>Unread</Badge>}
                </div>
                {m.subject && <p className="font-medium mt-2">{m.subject}</p>}
                <p className="mt-1 whitespace-pre-wrap text-sm">{m.message}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleRead.mutate({ id: m.id, read: !m.is_read })}>
                  <Check className="h-4 w-4 mr-1" />{m.is_read ? "Mark unread" : "Mark read"}
                </Button>
                {canDelete(role) && (
                  <Button size="sm" variant="destructive" onClick={() => { if (confirm("Delete?")) remove.mutate(m.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
        {data && data.length === 0 && <p className="text-muted-foreground">No messages yet.</p>}
      </div>
    </div>
  );
}

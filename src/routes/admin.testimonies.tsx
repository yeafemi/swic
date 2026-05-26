import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2, Phone, Mail, Clock, ShieldCheck, Heart } from "lucide-react";
import { toast } from "sonner";
import { canDelete } from "@/lib/admin-permissions";
import { useAdminRole } from "@/hooks/use-admin-role";

export const Route = createFileRoute("/admin/testimonies")({
  component: TestimoniesAdmin,
});

function TestimoniesAdmin() {
  const qc = useQueryClient();
  const { role } = useAdminRole();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-testimonies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonies")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("testimonies")
        .update({ is_published: published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["admin-testimonies"] });
      toast.success(variables.published ? "Testimony published to frontend!" : "Testimony unpublished.");
    },
    onError: (err) => {
      toast.error("Failed to update status: " + err.message);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-testimonies"] });
      toast.success("Testimony deleted successfully.");
    },
    onError: (err) => {
      toast.error("Failed to delete testimony: " + err.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manage Testimonies</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve testimonies before publishing them to the public church website.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-semibold">
          <Heart className="h-3.5 w-3.5 fill-current" />
          <span>{data?.length || 0} Total</span>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading testimonies…</p>}

      <div className="space-y-4">
        {data?.map((t) => (
          <Card key={t.id} className="p-6 hover:border-primary/20 transition duration-200">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-bold text-foreground text-base">{t.name}</span>
                  {t.is_published ? (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">Published</Badge>
                  ) : (
                    <Badge variant="secondary">Pending Review</Badge>
                  )}
                </div>

                {/* Contact information - strictly for admins */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {t.phone}
                  </span>
                  {t.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {t.email}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(t.created_at).toLocaleString()}
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90 italic border-l-2 border-primary/20 pl-4 bg-muted/10 py-3 rounded-r-lg">
                  "{t.text}"
                </p>
              </div>

              <div className="flex gap-2 shrink-0 self-center">
                {t.is_published ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                    onClick={() => togglePublish.mutate({ id: t.id, published: false })}
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Unpublish
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white"
                    onClick={() => togglePublish.mutate({ id: t.id, published: true })}
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Approve & Publish
                  </Button>
                )}

                {canDelete(role) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this testimony? This action is permanent.")) {
                        remove.mutate(t.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {data && data.length === 0 && (
          <div className="text-center py-12 border border-dashed rounded-xl">
            <Heart className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No testimonies submitted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

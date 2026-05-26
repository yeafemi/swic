import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin/audit-logs")({
  component: AuditLogsAdmin,
});

type AuditLog = {
  id: string;
  user_email: string | null;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: unknown;
  new_data: unknown;
  created_at: string;
};

const formatTableName = (tbl: string) => {
  const mapping: Record<string, string> = {
    sermons: "Sermons",
    events: "Events",
    gallery_images: "Gallery",
    leaders: "Leadership",
    ministries: "Ministries",
    live_stream_settings: "Live Stream Settings",
    prayer_requests: "Prayer Requests",
    contact_messages: "Contact Messages",
    newsletter_subscribers: "Subscribers",
    user_roles: "User Roles",
    profiles: "User Profiles",
    "auth.users": "User Accounts",
  };
  return mapping[tbl] || tbl;
};

const formatActionName = (act: string) => {
  const mapping: Record<string, string> = {
    insert: "Created",
    update: "Updated",
    delete: "Deleted",
    create_user: "Created User Account",
    delete_user: "Deleted User Account",
    update_user_role: "Updated User Role",
  };
  return mapping[act] || act;
};

const getActionBadgeClass = (action: string) => {
  const act = action.toLowerCase();
  if (act.includes("insert") || act.includes("create")) {
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:text-emerald-400";
  }
  if (act.includes("delete") || act.includes("remove")) {
    return "bg-rose-500/10 text-rose-700 border-rose-500/25 dark:text-rose-400";
  }
  return "bg-blue-500/10 text-blue-700 border-blue-500/25 dark:text-blue-400";
};

function AuditLogsAdmin() {
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      // Filter out system or cascade entries that do not have an authenticated admin context
      return (data as AuditLog[]).filter(
        (log) => log.user_id !== null || log.user_email !== null
      );
    },
  });

  const toggleExpand = (id: string) => {
    setExpandedLogs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">Recent admin dashboard changes and the user who made them.</p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      <div className="space-y-3">
        {data?.map((log) => (
          <Card key={log.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={getActionBadgeClass(log.action)}>
                    {formatActionName(log.action)}
                  </Badge>
                  <span className="font-semibold text-foreground">
                    {formatTableName(log.table_name)}
                  </span>
                  {log.record_id && (
                    <span className="text-xs text-muted-foreground font-mono">
                      (ID: {log.record_id.slice(0, 8)}...)
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Performed by <span className="font-medium text-foreground">{log.user_email ?? "System"}</span> at {new Date(log.created_at).toLocaleString()}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpand(log.id)}
                className="text-xs text-muted-foreground hover:text-foreground h-8"
              >
                {expandedLogs[log.id] ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 mr-1.5" /> Hide Details
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 mr-1.5" /> View Details
                  </>
                )}
              </Button>
            </div>

            {expandedLogs[log.id] && (
              <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t border-dashed border-muted">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-semibold">Previous Value (Old Data)</div>
                  <pre className="max-h-52 overflow-auto rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground border">
                    {log.old_data ? JSON.stringify(log.old_data, null, 2) : "null"}
                  </pre>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground font-semibold">New Value (New Data)</div>
                  <pre className="max-h-52 overflow-auto rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground border">
                    {log.new_data ? JSON.stringify(log.new_data, null, 2) : "null"}
                  </pre>
                </div>
              </div>
            )}
          </Card>
        ))}
        {data && data.length === 0 && <p className="text-muted-foreground">No audit entries yet.</p>}
      </div>
    </div>
  );
}

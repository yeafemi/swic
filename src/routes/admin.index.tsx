import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { HandHelping, MessageSquare, Mail, BookOpen, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function StatCard({ to, icon: Icon, label, value, accent }: { to: string; icon: typeof HandHelping; label: string; value: number | string; accent?: boolean }) {
  return (
    <Link to={to}>
      <Card className={`p-6 hover:shadow-lg transition-shadow ${accent ? "border-primary/30" : ""}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <Icon className={`h-10 w-10 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        </div>
      </Card>
    </Link>
  );
}

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [pr, cm, ns, sm, ev] = await Promise.all([
        supabase.from("prayer_requests").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
        supabase.from("sermons").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
      ]);
      const [unreadPr, unreadCm] = await Promise.all([
        supabase.from("prayer_requests").select("id", { count: "exact", head: true }).eq("prayed_for", false),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
      ]);
      return {
        prayers: pr.count ?? 0,
        unreadPrayers: unreadPr.count ?? 0,
        messages: cm.count ?? 0,
        unreadMessages: unreadCm.count ?? 0,
        subscribers: ns.count ?? 0,
        sermons: sm.count ?? 0,
        events: ev.count ?? 0,
      };
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your ministry platform</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard to="/admin/prayer-requests" icon={HandHelping} label={`Prayer Requests (${stats?.unreadPrayers ?? 0} new)`} value={stats?.prayers ?? "…"} accent={!!stats?.unreadPrayers} />
        <StatCard to="/admin/messages" icon={MessageSquare} label={`Contact Messages (${stats?.unreadMessages ?? 0} new)`} value={stats?.messages ?? "…"} accent={!!stats?.unreadMessages} />
        <StatCard to="/admin/subscribers" icon={Mail} label="Newsletter Subscribers" value={stats?.subscribers ?? "…"} />
        <StatCard to="/admin/sermons" icon={BookOpen} label="Sermons" value={stats?.sermons ?? "…"} />
        <StatCard to="/admin/events" icon={CalendarDays} label="Events" value={stats?.events ?? "…"} />
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-2">First-time setup</h2>
        <p className="text-sm text-muted-foreground">
          To grant admin access to a user, view the backend, open the <code className="bg-muted px-1 rounded">user_roles</code> table, and insert a row with the user's ID and role <code className="bg-muted px-1 rounded">admin</code>.
        </p>
      </Card>
    </div>
  );
}

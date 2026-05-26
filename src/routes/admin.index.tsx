import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { HandHelping, MessageSquare, BookOpen, CalendarDays, Quote, Sliders, Sparkles, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

interface StatCardProps {
  to: string;
  icon: typeof HandHelping;
  label: string;
  value: number | string;
  badge?: string | null;
  colorScheme: {
    border: string;
    bg: string;
    iconColor: string;
    badgeBg: string;
  };
}

function StatCard({ to, icon: Icon, label, value, badge, colorScheme }: StatCardProps) {
  return (
    <Link to={to} className="group block cursor-pointer select-none">
      <Card className={`p-6 border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-elegant flex flex-col justify-between h-full ${colorScheme.border} ${colorScheme.bg}`}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold tracking-wider uppercase text-muted-foreground/80">{label}</p>
            <p className="text-3xl font-extrabold text-foreground tracking-tight mt-1 transition-all duration-300 group-hover:text-primary">
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${colorScheme.iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-muted/20 pt-4 mt-6">
          <div className="flex items-center gap-1.5">
            {badge ? (
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${colorScheme.badgeBg}`}>
                {badge}
              </span>
            ) : (
              <span className="text-[10px] font-bold text-muted-foreground/70 uppercase">
                Manage Section
              </span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </Card>
    </Link>
  );
}

function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [pr, cm, sm, ev, tm, hs] = await Promise.all([
        supabase.from("prayer_requests").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
        supabase.from("sermons").select("id", { count: "exact", head: true }),
        supabase.from("events").select("id", { count: "exact", head: true }),
        supabase.from("testimonies").select("id", { count: "exact", head: true }),
        supabase.from("hero_slides").select("id", { count: "exact", head: true }),
      ]);
      const [unreadPr, unreadCm, pendingTm] = await Promise.all([
        supabase.from("prayer_requests").select("id", { count: "exact", head: true }).eq("prayed_for", false),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("testimonies").select("id", { count: "exact", head: true }).eq("is_published", false),
      ]);
      return {
        prayers: pr.count ?? 0,
        unreadPrayers: unreadPr.count ?? 0,
        messages: cm.count ?? 0,
        unreadMessages: unreadCm.count ?? 0,
        sermons: sm.count ?? 0,
        events: ev.count ?? 0,
        testimonies: tm.count ?? 0,
        pendingTestimonies: pendingTm.count ?? 0,
        slides: hs.count ?? 0,
      };
    },
  });

  const colorSchemes = {
    prayers: {
      border: "hover:border-rose-500/35 border-muted/50",
      bg: "bg-gradient-to-br from-rose-500/[0.02] to-transparent hover:from-rose-500/[0.06]",
      iconColor: "bg-rose-500/10 text-rose-500",
      badgeBg: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    },
    messages: {
      border: "hover:border-blue-500/35 border-muted/50",
      bg: "bg-gradient-to-br from-blue-500/[0.02] to-transparent hover:from-blue-500/[0.06]",
      iconColor: "bg-blue-500/10 text-blue-500",
      badgeBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    },
    testimonies: {
      border: "hover:border-amber-500/35 border-muted/50",
      bg: "bg-gradient-to-br from-amber-500/[0.02] to-transparent hover:from-amber-500/[0.06]",
      iconColor: "bg-amber-500/10 text-amber-500",
      badgeBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    },
    sermons: {
      border: "hover:border-violet-500/35 border-muted/50",
      bg: "bg-gradient-to-br from-violet-500/[0.02] to-transparent hover:from-violet-500/[0.06]",
      iconColor: "bg-violet-500/10 text-violet-500",
      badgeBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    },
    events: {
      border: "hover:border-emerald-500/35 border-muted/50",
      bg: "bg-gradient-to-br from-emerald-500/[0.02] to-transparent hover:from-emerald-500/[0.06]",
      iconColor: "bg-emerald-500/10 text-emerald-500",
      badgeBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    },
    slides: {
      border: "hover:border-purple-500/35 border-muted/50",
      bg: "bg-gradient-to-br from-purple-500/[0.02] to-transparent hover:from-purple-500/[0.06]",
      iconColor: "bg-purple-500/10 text-purple-500",
      badgeBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
    },
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time overview and administration panel for your church website.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-xs text-primary font-semibold">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          <span>System Fully Operational</span>
        </div>
      </div>

      {/* DYNAMIC METRICS GRID */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          to="/admin/prayer-requests"
          icon={HandHelping}
          label="Prayer Requests"
          value={isLoading ? "…" : stats?.prayers ?? 0}
          badge={stats?.unreadPrayers ? `${stats.unreadPrayers} new` : null}
          colorScheme={colorSchemes.prayers}
        />
        <StatCard
          to="/admin/messages"
          icon={MessageSquare}
          label="Contact Messages"
          value={isLoading ? "…" : stats?.messages ?? 0}
          badge={stats?.unreadMessages ? `${stats.unreadMessages} new` : null}
          colorScheme={colorSchemes.messages}
        />
        <StatCard
          to="/admin/testimonies"
          icon={Quote}
          label="Testimonies"
          value={isLoading ? "…" : stats?.testimonies ?? 0}
          badge={stats?.pendingTestimonies ? `${stats.pendingTestimonies} pending` : null}
          colorScheme={colorSchemes.testimonies}
        />
        <StatCard
          to="/admin/sermons"
          icon={BookOpen}
          label="Sermons"
          value={isLoading ? "…" : stats?.sermons ?? 0}
          colorScheme={colorSchemes.sermons}
        />
        <StatCard
          to="/admin/events"
          icon={CalendarDays}
          label="Events"
          value={isLoading ? "…" : stats?.events ?? 0}
          colorScheme={colorSchemes.events}
        />
        <StatCard
          to="/admin/hero-slides"
          icon={Sliders}
          label="Hero Slider"
          value={isLoading ? "…" : stats?.slides ?? 0}
          colorScheme={colorSchemes.slides}
        />
      </div>

      {/* SETUP CARD CALLOUT */}
      <Card className="p-6 bg-gradient-to-r from-muted/50 via-muted/30 to-transparent border border-muted/80 relative overflow-hidden group">
        <div className="absolute right-0 top-0 h-32 w-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-500" />
        <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
          First-time Administration Setup
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          To register new admin members, log into the database dashboard, open the{" "}
          <code className="bg-muted-foreground/15 dark:bg-muted px-1.5 py-0.5 rounded font-mono text-foreground font-semibold">user_roles</code> table, and insert a new row linking the user's ID with the role{" "}
          <code className="bg-muted-foreground/15 dark:bg-muted px-1.5 py-0.5 rounded font-mono text-foreground font-semibold text-primary">admin</code> or{" "}
          <code className="bg-muted-foreground/15 dark:bg-muted px-1.5 py-0.5 rounded font-mono text-foreground font-semibold text-primary">editor</code>.
        </p>
      </Card>
    </div>
  );
}

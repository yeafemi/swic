import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { HandHelping, MessageSquare, BookOpen, CalendarDays, Quote, Sliders, Sparkles, ChevronRight, TrendingUp, BarChart2, Eye, Calendar } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";

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
  const [mounted, setMounted] = useState(false);
  const [visitsFilter, setVisitsFilter] = useState<"daily" | "weekly" | "monthly" | "yearly" | "custom">("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const { data: visitsData } = useQuery({
    queryKey: ["admin-site-visits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_visits")
        .select("visitor_id, visited_at")
        .order("visited_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const processedVisits = useMemo(() => {
    if (!visitsData) {
      return { totalUnique: 0, trend: [], avgVisits: 0 };
    }

    const now = new Date();
    let start = new Date();
    let groupByKey: "hour" | "day" | "month" = "day";

    if (visitsFilter === "daily") {
      start.setHours(0, 0, 0, 0);
      groupByKey = "hour";
    } else if (visitsFilter === "weekly") {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      groupByKey = "day";
    } else if (visitsFilter === "monthly") {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      groupByKey = "day";
    } else if (visitsFilter === "yearly") {
      start.setDate(now.getDate() - 365);
      start.setHours(0, 0, 0, 0);
      groupByKey = "month";
    } else if (visitsFilter === "custom") {
      if (startDate) {
        start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
      } else {
        start.setDate(now.getDate() - 30);
      }
      groupByKey = "day";
    }

    const end = visitsFilter === "custom" && endDate ? new Date(endDate) : new Date(now);
    if (visitsFilter === "custom") {
      end.setHours(23, 59, 59, 999);
    }

    if (visitsFilter === "custom") {
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      groupByKey = diffDays > 60 ? "month" : "day";
    }

    const filtered = visitsData.filter((v) => {
      const d = new Date(v.visited_at);
      return d >= start && d <= end;
    });

    const totalUnique = new Set(filtered.map((v) => v.visitor_id)).size;
    const trendMap: Record<string, Set<string>> = {};

    if (groupByKey === "hour") {
      for (let h = 0; h < 24; h += 4) {
        const label = `${h}:00`;
        trendMap[label] = new Set();
      }
      filtered.forEach((v) => {
        const d = new Date(v.visited_at);
        const hour = d.getHours();
        const block = Math.floor(hour / 4) * 4;
        const label = `${block}:00`;
        if (trendMap[label]) {
          trendMap[label].add(v.visitor_id);
        }
      });
    } else if (groupByKey === "day") {
      const tempDate = new Date(start);
      const limitDate = new Date(end);
      let safety = 0;
      while (tempDate <= limitDate && safety < 100) {
        const label = tempDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        trendMap[label] = new Set();
        tempDate.setDate(tempDate.getDate() + 1);
        safety++;
      }
      filtered.forEach((v) => {
        const label = new Date(v.visited_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        if (trendMap[label]) {
          trendMap[label].add(v.visitor_id);
        }
      });
    } else if (groupByKey === "month") {
      const tempDate = new Date(start);
      const limitDate = new Date(end);
      let safety = 0;
      while (tempDate <= limitDate && safety < 100) {
        const label = tempDate.toLocaleDateString(undefined, { year: "2-digit", month: "short" });
        trendMap[label] = new Set();
        tempDate.setMonth(tempDate.getMonth() + 1);
        safety++;
      }
      filtered.forEach((v) => {
        const label = new Date(v.visited_at).toLocaleDateString(undefined, { year: "2-digit", month: "short" });
        if (trendMap[label]) {
          trendMap[label].add(v.visitor_id);
        }
      });
    }

    const trend = Object.entries(trendMap).map(([name, set]) => ({
      name,
      "Unique Visitors": set.size,
    }));

    const avgVisits = trend.length ? Math.round(totalUnique / trend.length) : 0;

    return { totalUnique, trend, avgVisits };
  }, [visitsData, visitsFilter, startDate, endDate]);

  const { data: givingData } = useQuery({
    queryKey: ["admin-giving-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("giving_records")
        .select("amount, giving_type, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const processedGiving = (() => {
    if (!givingData || givingData.length === 0) {
      return [];
    }

    const groups: Record<string, { Tithe: number; Offering: number; Missions: number }> = {};
    givingData.slice(-15).forEach((record) => {
      const date = new Date(record.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      if (!groups[date]) {
        groups[date] = { Tithe: 0, Offering: 0, Missions: 0 };
      }
      const type = (record.giving_type || "").toLowerCase();
      if (type.includes("tithe")) {
        groups[date].Tithe += record.amount;
      } else if (type.includes("offering")) {
        groups[date].Offering += record.amount;
      } else {
        groups[date].Missions += record.amount;
      }
    });

    return Object.entries(groups).map(([name, val]) => ({
      name,
      Tithe: val.Tithe,
      Offering: val.Offering,
      Missions: val.Missions,
    }));
  })();

  const activityData = [
    { name: "Prayers", count: stats?.prayers || 0, color: "#f43f5e" },
    { name: "Messages", count: stats?.messages || 0, color: "#3b82f6" },
    { name: "Testimonies", count: stats?.testimonies || 0, color: "#f59e0b" },
    { name: "Sermons", count: stats?.sermons || 0, color: "#8b5cf6" },
    { name: "Events", count: stats?.events || 0, color: "#10b981" },
  ];

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

      {/* SOPHISTICATED CHARTS SECTION */}
      {mounted && (
        <div className="space-y-6">
          {/* Chart Row 1: Website Visits (New!) */}
          <Card className="p-6 border bg-card flex flex-col justify-between hover:shadow-soft transition duration-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-muted/20 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <Eye className="h-4 w-4" />
                  <span>Traffic & Engagement</span>
                </div>
                <h3 className="text-xl font-extrabold text-foreground mt-1">Unique Site Visits</h3>
                <p className="text-xs text-muted-foreground">
                  Monitor unique visitors and traffic patterns over time.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-1 bg-muted/30 p-1.5 rounded-xl border border-muted/30">
                {(["daily", "weekly", "monthly", "yearly", "custom"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setVisitsFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase cursor-pointer ${
                      visitsFilter === filter
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Period Selectors */}
            {visitsFilter === "custom" && (
              <div className="flex flex-wrap gap-4 mt-4 p-4 rounded-xl bg-muted/20 border border-muted/50 items-end animate-fade-in-up">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  />
                </div>
              </div>
            )}

            {/* Micro Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6 p-4 rounded-2xl bg-gradient-to-br from-primary/[0.01] to-amber-500/[0.01] border border-muted/10">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Unique Visitors</p>
                <p className="text-3xl font-black text-foreground mt-1">{processedVisits.totalUnique}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg Visitors / Interval</p>
                <p className="text-3xl font-black text-foreground mt-1">{processedVisits.avgVisits}</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Period Filter</p>
                <p className="text-sm font-extrabold text-primary uppercase mt-2 tracking-wide">
                  {visitsFilter === "custom"
                    ? `${startDate || "Start Date"} — ${endDate || "End Date"}`
                    : visitsFilter}
                </p>
              </div>
            </div>

            {/* Chart Area */}
            <div className="h-64 w-full mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={processedVisits.trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#af160f" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#af160f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                  <XAxis
                    dataKey="name"
                    stroke="#88888880"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#88888880"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} Unique Visitors`]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Unique Visitors"
                    stroke="#af160f"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorVisits)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart Row 2: Financial Trends and Platform activity */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Chart 1: Online Giving Trends (Area Chart) */}
            <Card className="p-6 lg:col-span-2 border bg-card flex flex-col justify-between hover:shadow-soft transition duration-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <TrendingUp className="h-4 w-4" />
                  <span>Financial Analysis</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mt-1">Online Giving Trends</h3>
                <p className="text-xs text-muted-foreground">
                  Overview of recent tithes, offerings, and missions records.
                </p>
              </div>

              <div className="h-72 w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processedGiving} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTithe" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#dcbe52" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#dcbe52" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorOffering" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#af160f" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#af160f" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorMissions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                    <XAxis
                      dataKey="name"
                      stroke="#88888880"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#88888880"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `GHS ${val}`}
                    />
                    <Tooltip
                      formatter={(value) => [`GHS ${value}`]}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Tithe"
                      stroke="#dcbe52"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorTithe)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Offering"
                      stroke="#af160f"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorOffering)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Missions"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorMissions)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Chart 2: Platform Distribution (Bar Chart) */}
            <Card className="p-6 border bg-card flex flex-col justify-between hover:shadow-soft transition duration-200">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
                  <BarChart2 className="h-4 w-4" />
                  <span>Engagement Insights</span>
                </div>
                <h3 className="text-lg font-bold text-foreground mt-1">Platform Activity</h3>
                <p className="text-xs text-muted-foreground">
                  Distribution of records across database modules.
                </p>
              </div>

              <div className="h-72 w-full mt-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888815" />
                    <XAxis
                      dataKey="name"
                      stroke="#88888880"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#88888880"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(0,0,0,0.02)" }}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={45}>
                      {activityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

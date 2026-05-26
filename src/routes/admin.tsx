import { createFileRoute, Outlet, Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LayoutDashboard, MessageSquare, HandHelping, Mail, BookOpen, CalendarDays, LogOut, Home, Users, Image as ImageIcon, UserCog, Heart, Radio, ShieldCheck, ClipboardList, Quote } from "lucide-react";
import { toast } from "sonner";
import { canAccessAdminPath, canManageUsers, canViewAuditLogs, ROLE_LABELS, type AdminRole } from "@/lib/admin-permissions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — SWIC" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/prayer-requests", label: "Prayer Requests", icon: HandHelping },
  { to: "/admin/messages", label: "Contact Messages", icon: MessageSquare },
  { to: "/admin/subscribers", label: "Subscribers", icon: Mail },
  { to: "/admin/giving", label: "Online Giving", icon: Heart },
  { to: "/admin/testimonies", label: "Testimonies", icon: Quote },
  { to: "/admin/sermons", label: "Sermons", icon: BookOpen },
  { to: "/admin/events", label: "Events", icon: CalendarDays },
  { to: "/admin/live-stream", label: "Live Stream", icon: Radio },
  { to: "/admin/ministries", label: "Ministries", icon: Users },
  { to: "/admin/leaders", label: "Leadership", icon: UserCog },
  { to: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { to: "/admin/users", label: "Users & Roles", icon: ShieldCheck, superOnly: true },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList, superOnly: true },
];

function AdminLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState<AdminRole | null>(null);
  const [email, setEmail] = useState("");
  const [bootstrapping, setBootstrapping] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshAuth = async () => {
    setChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSignedIn(false);
        setIsAdmin(false);
        setRole(null);
        setEmail("");
        setErrorMsg(null);
        setChecking(false);
        return;
      }

      setSignedIn(true);
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      const roles = (data ?? []).map((item) => item.role as string);
      const resolvedRole: AdminRole | null = roles.includes("super_admin")
        ? "super_admin"
        : roles.includes("admin")
          ? "admin"
          : roles.includes("editor")
            ? "editor"
            : null;
      setRole(resolvedRole);
      setIsAdmin(!!resolvedRole);
      setErrorMsg(null);
      setChecking(false);
    } catch (err: unknown) {
      console.error("Auth check failed:", err);
      setErrorMsg(err instanceof Error ? err.message : "Failed to connect to Supabase");
      setChecking(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSignedIn(false);
    setIsAdmin(false);
    setRole(null);
    setEmail("");
    toast.success("Signed out");
    navigate({ to: "/admin" });
  };

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center">Loading…</div>;
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
        <Card className="w-full max-w-lg p-8 border-destructive/30 shadow-elegant">
          <div className="text-center mb-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
              <ShieldCheck className="w-6 h-6 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold text-destructive">Supabase Configuration Missing</h1>
            <p className="text-sm text-muted-foreground mt-2">
              The admin dashboard cannot initialize because the Supabase keys are not set up in your GitHub Repository Secrets.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/10 text-xs font-mono text-destructive-foreground break-all">
              {errorMsg}
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">How to fix this:</h3>
              <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-2.5">
                <li>
                  Go to your GitHub repository at{" "}
                  <a
                    href="https://github.com/yeafemi/swic"
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-primary hover:text-primary/80 font-medium"
                  >
                    github.com/yeafemi/swic
                  </a>
                </li>
                <li>
                  Navigate to <strong>Settings</strong> &rarr; <strong>Secrets and variables</strong> &rarr; <strong>Actions</strong>.
                </li>
                <li>
                  Click <strong>New repository secret</strong> and add:
                  <div className="mt-1.5 p-2 bg-muted rounded font-mono text-[10px] select-all">
                    Name: VITE_SUPABASE_URL<br />
                    Value: https://elblsnadurmnszsmpfnu.supabase.co
                  </div>
                </li>
                <li>
                  Click <strong>New repository secret</strong> again and add:
                  <div className="mt-1.5 p-2 bg-muted rounded font-mono text-[10px] select-all">
                    Name: VITE_SUPABASE_PUBLISHABLE_KEY<br />
                    Value: sb_publishable_1Dqn6KSNqRUIiAYut4_sng_5tTpKu_E
                  </div>
                </li>
                <li>
                  Go to the <strong>Actions</strong> tab in your repository, select your latest deployment workflow run, and click <strong>Re-run all jobs</strong> (or make a small push/commit to trigger a new build).
                </li>
              </ol>
            </div>
          </div>
          
          <div className="mt-8 flex justify-center">
            <Button asChild variant="outline">
              <Link to="/">Back to website</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!signedIn) {
    return <AdminLogin onSignedIn={refreshAuth} />;
  }

  if (!isAdmin) {

    const bootstrapAdmin = async () => {
      setBootstrapping(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          toast.error("Session expired — please sign in again");
          setBootstrapping(false);
          return;
        }
        const res = await fetch("/api/admin/bootstrap", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const body = await res.json();
        if (!res.ok) {
          toast.error(body.error ?? "Bootstrap failed");
          setBootstrapping(false);
          return;
        }
        toast.success(body.message ?? "You are now a Super Admin!");
        await refreshAuth();
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
        setBootstrapping(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">Admin Setup</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your account ({email}) is signed in, but it doesn't have admin privileges yet.
          </p>
          <div className="mt-6 rounded-md border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Click below to activate your account as the first Super Admin.
            </p>
            <Button
              onClick={bootstrapAdmin}
              disabled={bootstrapping}
              className="mt-4 w-full"
            >
              {bootstrapping ? "Setting up…" : "Activate Admin Access"}
            </Button>
          </div>
          <div className="mt-6 flex gap-3 justify-center">
            <Button asChild variant="outline"><Link to="/">Home</Link></Button>
            <Button onClick={signOut} variant="destructive"><LogOut className="mr-2 h-4 w-4" />Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!canAccessAdminPath(role, pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">Section unavailable</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your {role ? ROLE_LABELS[role] : "current"} role does not have access to this section.
          </p>
          <div className="mt-6">
            <Button asChild><Link to="/admin">Back to dashboard</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  const visibleNav = NAV.filter((item) => {
    if (item.to === "/admin/users") return canManageUsers(role);
    if (item.to === "/admin/audit-logs") return canViewAuditLogs(role);
    return canAccessAdminPath(role, item.to);
  });

  return (
    <div className="min-h-screen bg-muted/20 flex">
      <aside className="w-64 bg-card border-r hidden md:flex flex-col">
        <div className="p-6 border-b">
          <Link to="/admin" className="font-bold text-lg text-primary">SWIC Admin</Link>
          <p className="text-xs text-muted-foreground truncate mt-1">{email}</p>
          {role && <p className="text-xs text-primary mt-1">{ROLE_LABELS[role]}</p>}
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {visibleNav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active ? "bg-primary text-primary-foreground" : "hover:bg-muted text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted">
            <Home className="h-4 w-4" /> View site
          </Link>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted text-left">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-card border-b p-4 flex items-center justify-between">
          <Link to="/admin" className="font-bold text-primary">SWIC Admin</Link>
          <button onClick={signOut}><LogOut className="h-5 w-5" /></button>
        </header>
        <nav className="md:hidden bg-card border-b overflow-x-auto flex gap-1 p-2">
          {visibleNav.map((item) => {
            const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs whitespace-nowrap ${active ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                <item.icon className="h-3.5 w-3.5" />{item.label}
              </Link>
            );
          })}
        </nav>
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminLogin({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const [email, setEmail] = useState("admin@swic.org");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back");
      await onSignedIn();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-muted/30">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary">SWIC Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage the site</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={255}
            />
          </div>
          <div>
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={72}
            />
          </div>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Please wait..." : "Sign In"}
          </Button>
        </form>
        <div className="text-center mt-4">
          <Link to="/" className="text-xs text-muted-foreground hover:underline">Back to site</Link>
        </div>
      </Card>
    </div>
  );
}

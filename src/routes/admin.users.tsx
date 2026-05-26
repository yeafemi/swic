import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ROLE_LABELS, ROLE_OPTIONS, type AdminRole } from "@/lib/admin-permissions";
import { Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: UsersAdmin,
});

type AdminUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: AdminRole[];
};

type UserResponse = { users: AdminUser[] };

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.session?.access_token ?? ""}`,
  };
}

function UsersAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", displayName: "", password: "", role: "editor" as AdminRole });
  const [drafts, setDrafts] = useState<Record<string, { displayName: string; role: AdminRole }>>({});

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/admin/users", { headers: await authHeaders() });
        const text = await res.text();
        if (text.trim().startsWith("<!DOCTYPE")) {
          throw new Error("HTML response");
        }
        const payload = JSON.parse(text) as UserResponse | { error: string };
        if (!res.ok) throw new Error("error" in payload ? payload.error : "Unable to load users");
        const users = (payload as UserResponse).users;
        setDrafts(Object.fromEntries(users.map((user) => [
          user.id,
          { displayName: user.display_name ?? "", role: user.roles[0] ?? "editor" },
        ])));
        return users;
      } catch (err) {
        console.warn("API list users failed, falling back to client-side Supabase query:", err);
        const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
          supabase.from("profiles").select("id, email, display_name, created_at"),
          supabase.from("user_roles").select("user_id, role, created_at"),
        ]);
        if (pErr || rErr) {
          throw new Error(pErr?.message ?? rErr?.message ?? "Unable to load users directly from database");
        }
        
        const rolesByUser = new Map<string, string[]>();
        for (const role of roles ?? []) {
          const list = rolesByUser.get(role.user_id) ?? [];
          list.push(role.role);
          rolesByUser.set(role.user_id, list);
        }

        const users: AdminUser[] = (profiles ?? []).map((item) => ({
          id: item.id,
          email: item.email,
          display_name: item.display_name,
          created_at: item.created_at,
          last_sign_in_at: null,
          roles: (rolesByUser.get(item.id) ?? []) as AdminRole[],
        }));

        setDrafts(Object.fromEntries(users.map((user) => [
          user.id,
          { displayName: user.display_name ?? "", role: user.roles[0] ?? "editor" },
        ])));
        return users;
      }
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: await authHeaders(),
          body: JSON.stringify(newUser),
        });
        const text = await res.text();
        if (text.trim().startsWith("<!DOCTYPE")) {
          throw new Error("HTML response");
        }
        const payload = JSON.parse(text) as { error?: string };
        if (!res.ok) throw new Error(payload.error ?? "Unable to create user");
      } catch (err) {
        console.warn("API create user failed, falling back to client-side Supabase:", err);
        throw new Error("To add a new admin/editor on static hosts, they must sign up on the site first, and then you can assign them a role in this list.");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User created successfully");
      setNewUser({ email: "", displayName: "", password: "", role: "editor" });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async (userId: string) => {
      try {
        const res = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: await authHeaders(),
          body: JSON.stringify({ userId, displayName: drafts[userId].displayName, role: drafts[userId].role }),
        });
        const text = await res.text();
        if (text.trim().startsWith("<!DOCTYPE")) {
          throw new Error("HTML response");
        }
        const payload = JSON.parse(text) as { error?: string };
        if (!res.ok) throw new Error(payload.error ?? "Unable to update user");
      } catch (err) {
        console.warn("API update user failed, falling back to client-side Supabase:", err);
        const draft = drafts[userId];
        
        // 1. Update user role in user_roles table
        const { error: delErr } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);
        if (delErr) throw new Error(delErr.message);

        const { error: insErr } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: draft.role });
        if (insErr) throw new Error(insErr.message);

        // 2. Update display name in profiles table
        const { error: profErr } = await supabase
          .from("profiles")
          .update({ display_name: draft.displayName })
          .eq("id", userId);
        if (profErr) throw new Error(profErr.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (userId: string) => {
      try {
        const res = await fetch(`/api/admin/users?userId=${encodeURIComponent(userId)}`, {
          method: "DELETE",
          headers: await authHeaders(),
        });
        const text = await res.text();
        if (text.trim().startsWith("<!DOCTYPE")) {
          throw new Error("HTML response");
        }
        const payload = JSON.parse(text) as { error?: string };
        if (!res.ok) throw new Error(payload.error ?? "Unable to delete user");
      } catch (err) {
        console.warn("API delete user failed, falling back to client-side Supabase:", err);
        const { error: delErr } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);
        if (delErr) throw new Error(delErr.message);

        const { error: profErr } = await supabase
          .from("profiles")
          .delete()
          .eq("id", userId);
        if (profErr) throw new Error(profErr.message);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User deleted / admin access revoked");
    },
    onError: (e: Error) => toast.error(e.message),
  });


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Users & Roles</h1>
          <p className="text-muted-foreground mt-1">Create admin users and assign dashboard access.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="space-y-4">
              <div><Label>Email</Label><Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required /></div>
              <div><Label>Name</Label><Input value={newUser.displayName} onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })} /></div>
              <div><Label>Password</Label><Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} minLength={8} required /></div>
              <div>
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={(role) => setNewUser({ ...newUser, role: role as AdminRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLE_OPTIONS.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={create.isPending} className="w-full">{create.isPending ? "Creating..." : "Create user"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}
      {error && <p className="text-sm text-destructive">{(error as Error).message}</p>}

      <div className="space-y-3">
        {data?.map((user) => {
          const draft = drafts[user.id] ?? { displayName: user.display_name ?? "", role: user.roles[0] ?? "editor" };
          return (
            <Card key={user.id} className="p-5">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_220px_auto] lg:items-end">
                <div>
                  <div className="font-semibold">{user.email}</div>
                  <div className="text-xs text-muted-foreground">Created {new Date(user.created_at).toLocaleString()}</div>
                  {user.last_sign_in_at && <div className="text-xs text-muted-foreground">Last sign-in {new Date(user.last_sign_in_at).toLocaleString()}</div>}
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={draft.displayName} onChange={(e) => setDrafts({ ...drafts, [user.id]: { ...draft, displayName: e.target.value } })} />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={draft.role} onValueChange={(role) => setDrafts({ ...drafts, [user.id]: { ...draft, role: role as AdminRole } })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLE_OPTIONS.map((role) => <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => update.mutate(user.id)}><Save className="h-4 w-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => { if (confirm(`Delete ${user.email}?`)) remove.mutate(user.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="mt-3 text-xs text-primary">{draft.role ? ROLE_LABELS[draft.role] : "No role"}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

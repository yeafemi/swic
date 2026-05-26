import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AdminRole } from "@/lib/admin-permissions";

export function useAdminRole() {
  const [role, setRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) {
          setRole(null);
          setLoading(false);
        }
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .in("role", ["super_admin", "admin", "editor"])
        .order("role", { ascending: false });

      const roles = (data ?? []).map((item) => item.role as AdminRole);
      const resolved = roles.includes("super_admin")
        ? "super_admin"
        : roles.includes("admin")
          ? "admin"
          : roles.includes("editor")
            ? "editor"
            : null;

      if (mounted) {
        setRole(resolved);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { role, loading };
}

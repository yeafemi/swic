export type AdminRole = "super_admin" | "admin" | "editor";

export const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  editor: "Editor",
};

export const ROLE_OPTIONS: { value: AdminRole; label: string }[] = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
];

/**
 * Determines if a given admin role can access a particular admin path.
 * Currently all admin roles can access any admin section; more granular
 * logic can be added later.
 */
export function canAccessAdminPath(role: AdminRole | null, path: string): boolean {
  if (!role) return false;
  // For now, any admin role has access to all admin routes.
  return role === "super_admin" || role === "admin" || role === "editor";
}

/** Only super admins or admins can manage users and roles */
export function canManageUsers(role: AdminRole | null): boolean {
  return role === "super_admin" || role === "admin";
}

/** Only super admins or admins can view audit logs */
export function canViewAuditLogs(role: AdminRole | null): boolean {
  return role === "super_admin" || role === "admin";
}

/** Only super admins can delete content */
export function canDelete(role: AdminRole | null): boolean {
  return role === "super_admin";
}


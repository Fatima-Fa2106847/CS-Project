import type { SessionRole } from "./sessions";

export type Permission =
  | "manage_users"
  | "approve_registrations"
  | "assign_roles"
  | "view_security_events";

export function hasPermission(
  role: SessionRole,
  permission: Permission
): boolean {
  return role === "admin" &&
    (permission === "manage_users" ||
      permission === "approve_registrations" ||
      permission === "assign_roles" ||
      permission === "view_security_events");
}

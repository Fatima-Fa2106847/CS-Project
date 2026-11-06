
export type UserRole = "student" | "instructor" | "admin";

export type Permission =
  | "view_own_grades"
  | "view_assigned_grades"
  | "edit_assigned_grades"
  | "view_own_courses"
  | "view_assigned_courses"
  | "manage_users"
  | "approve_registrations"
  | "assign_roles"
  | "view_security_events";

const rolePermissions: Record<UserRole, Permission[]> = {
  student: [
    "view_own_grades",
    "view_own_courses",
  ],

  instructor: [
    "view_assigned_grades",
    "edit_assigned_grades",
    "view_assigned_courses",
  ],

  admin: [
    "manage_users",
    "approve_registrations",
    "assign_roles",
    "view_security_events",
  ],
};

export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

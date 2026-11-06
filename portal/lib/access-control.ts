
import type { UserRole } from "./permissions";

// Represents the authenticated user information
// that will eventually come from the authentication module.
export type PortalUser = {
  id: string;
  name: string;
  role: UserRole;
  enrolledCourses: string[];
  assignedCourses: string[];
};

export type GradeRecord = {
  studentId: string;
  courseId: string;
  assignmentGrade: number;
  examGrade: number;
};

// Students can only view their own grades.
// Instructors can view grades in their assigned courses.
// Administrators cannot view grade values.
export function canViewGrade(
  user: PortalUser,
  grade: GradeRecord
): boolean {
  if (user.role === "student") {
    return user.id === grade.studentId;
  }

  if (user.role === "instructor") {
    return user.assignedCourses.includes(grade.courseId);
  }

  return false;
}

// Only instructors assigned to a course can edit its grades.
export function canEditGrade(
  user: PortalUser,
  courseId: string
): boolean {
  return (
    user.role === "instructor" &&
    user.assignedCourses.includes(courseId)
  );
}

// Students can access their enrolled courses.
// Instructors can access their assigned courses.
export function canAccessCourse(
  user: PortalUser,
  courseId: string
): boolean {
  if (user.role === "student") {
    return user.enrolledCourses.includes(courseId);
  }

  if (user.role === "instructor") {
    return user.assignedCourses.includes(courseId);
  }

  return false;
}

// Only administrators can manage accounts.
export function canManageUsers(user: PortalUser): boolean {
  return user.role === "admin";
}

// Only administrators can approve registrations.
export function canApproveRegistration(user: PortalUser): boolean {
  return user.role === "admin";
}

// Only administrators can assign roles.
export function canAssignRoles(user: PortalUser): boolean {
  return user.role === "admin";
}

// Only administrators can view security events.
export function canViewSecurityEvents(user: PortalUser): boolean {
  return user.role === "admin";
}

// Validate grade values before accepting an update.
export function isValidGrade(
  assignmentGrade: number,
  examGrade: number
): boolean {
  return (
    Number.isFinite(assignmentGrade) &&
    Number.isFinite(examGrade) &&
    assignmentGrade >= 0 &&
    assignmentGrade <= 20 &&
    examGrade >= 0 &&
    examGrade <= 50
  );
}

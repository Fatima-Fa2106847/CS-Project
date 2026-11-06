
import type { UserRole } from "./permissions";

// Represents authenticated user information.
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

// Validate user information before checking permissions.
function isValidUser(user: PortalUser): boolean {
  return (
    typeof user.id === "string" &&
    user.id.trim().length > 0 &&
    ["student", "instructor", "admin"].includes(user.role) &&
    Array.isArray(user.enrolledCourses) &&
    Array.isArray(user.assignedCourses)
  );
}

// Validate grade information.
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

// Students can view their own grades.
// Instructors can view grades in assigned courses.
// Administrators cannot view grade values.
export function canViewGrade(
  user: PortalUser,
  grade: GradeRecord
): boolean {
  if (!isValidUser(user)) return false;

  if (
    typeof grade.studentId !== "string" ||
    typeof grade.courseId !== "string" ||
    !grade.studentId.trim() ||
    !grade.courseId.trim() ||
    !isValidGrade(grade.assignmentGrade, grade.examGrade)
  ) {
    return false;
  }

  if (user.role === "student") {
    return user.id === grade.studentId;
  }

  if (user.role === "instructor") {
    return user.assignedCourses.includes(grade.courseId);
  }

  return false;
}

// Only instructors assigned to a course can edit grades.
export function canEditGrade(
  user: PortalUser,
  courseId: string
): boolean {
  return (
    isValidUser(user) &&
    user.role === "instructor" &&
    typeof courseId === "string" &&
    courseId.trim().length > 0 &&
    user.assignedCourses.includes(courseId)
  );
}

// Students access enrolled courses.
// Instructors access assigned courses.
export function canAccessCourse(
  user: PortalUser,
  courseId: string
): boolean {
  if (
    !isValidUser(user) ||
    typeof courseId !== "string" ||
    !courseId.trim()
  ) {
    return false;
  }

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
  return isValidUser(user) && user.role === "admin";
}

// Only administrators can approve registrations.
export function canApproveRegistration(user: PortalUser): boolean {
  return isValidUser(user) && user.role === "admin";
}

// Only administrators can assign roles.
export function canAssignRoles(user: PortalUser): boolean {
  return isValidUser(user) && user.role === "admin";
}

// Only administrators can view security events.
export function canViewSecurityEvents(user: PortalUser): boolean {
  return isValidUser(user) && user.role === "admin";
}

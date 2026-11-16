import type { SessionRole } from "./sessions";

type GradeAccessUser = {
  id: string;
  name: string;
  role: SessionRole;
  enrolledCourses: readonly string[];
  assignedCourses: readonly string[];
};

type GradeRecord = {
  studentId: string;
  courseId: string;
  assignmentGrade: number;
  examGrade: number;
};

export function canViewGrade(
  user: GradeAccessUser,
  grade: GradeRecord
): boolean {
  return user.role === "student" &&
    user.id === grade.studentId &&
    user.enrolledCourses.includes(grade.courseId);
}

export function canEditGrade(
  user: GradeAccessUser,
  courseId: string
): boolean {
  return user.role === "instructor" &&
    user.assignedCourses.includes(courseId);
}

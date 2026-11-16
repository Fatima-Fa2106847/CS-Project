import type { SessionRole } from "./sessions";

type DemoUser = {
  id: string;
  name: string;
  role: SessionRole;
  enrolledCourses: string[];
  assignedCourses: string[];
};

export const demoUsers: DemoUser[] = [
  {
    id: "2021001",
    name: "Ahmed Ali",
    role: "student",
    enrolledCourses: ["CS380", "CS301", "MATH231"],
    assignedCourses: [],
  },
  {
    id: "2021002",
    name: "Sara Mohammed",
    role: "student",
    enrolledCourses: ["CS380", "CS301"],
    assignedCourses: [],
  },
  {
    id: "INS001",
    name: "Instructor",
    role: "instructor",
    enrolledCourses: [],
    assignedCourses: ["CS380", "CS301"],
  },
  {
    id: "ADMIN001",
    name: "Administrator",
    role: "admin",
    enrolledCourses: [],
    assignedCourses: [],
  },
];

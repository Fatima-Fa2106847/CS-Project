
import type { PortalUser } from "./access-control";

export const demoUsers: PortalUser[] = [
  {
    id: "2021001",
    name: "Ahmed Ali",
    role: "student",
    enrolledCourses: ["CS380", "CS301"],
    assignedCourses: [],
  },
  {
    id: "2021002",
    name: "Sara Mohammed",
    role: "student",
    enrolledCourses: ["CS380"],
    assignedCourses: [],
  },
  {
    id: "INS001",
    name: "Dr. Khalid",
    role: "instructor",
    enrolledCourses: [],
    assignedCourses: ["CS380", "CS301"],
  },
  {
    id: "ADMIN001",
    name: "Portal Administrator",
    role: "admin",
    enrolledCourses: [],
    assignedCourses: [],
  },
];

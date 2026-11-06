
import {
  canViewGrade,
  canEditGrade,
  canAccessCourse,
  canManageUsers,
  canApproveRegistration,
  canAssignRoles,
  isValidGrade,
} from "./access-control";

import { demoUsers } from "./demo-users";

const ahmed = demoUsers[0];
const sara = demoUsers[1];
const instructor = demoUsers[2];
const admin = demoUsers[3];

const grade = {
  studentId: "2021001",
  courseId: "CS380",
  assignmentGrade: 18,
  examGrade: 42,
};

const tests = [
  {
    name: "Student can view own grades",
    expected: true,
    actual: canViewGrade(ahmed, grade),
  },
  {
    name: "Student cannot view another student's grades",
    expected: false,
    actual: canViewGrade(sara, grade),
  },
  {
    name: "Instructor can view assigned course grades",
    expected: true,
    actual: canViewGrade(instructor, grade),
  },
  {
    name: "Admin cannot view grade values",
    expected: false,
    actual: canViewGrade(admin, grade),
  },
  {
    name: "Instructor can edit assigned course grades",
    expected: true,
    actual: canEditGrade(instructor, "CS380"),
  },
  {
    name: "Instructor cannot edit unassigned course grades",
    expected: false,
    actual: canEditGrade(instructor, "CS450"),
  },
  {
    name: "Student cannot edit grades",
    expected: false,
    actual: canEditGrade(ahmed, "CS380"),
  },
  {
    name: "Student can access enrolled course",
    expected: true,
    actual: canAccessCourse(ahmed, "CS380"),
  },
  {
    name: "Student cannot access unregistered course",
    expected: false,
    actual: canAccessCourse(sara, "CS301"),
  },
  {
    name: "Instructor can access assigned course",
    expected: true,
    actual: canAccessCourse(instructor, "CS301"),
  },
  {
    name: "Admin can manage users",
    expected: true,
    actual: canManageUsers(admin),
  },
  {
    name: "Admin can approve registrations",
    expected: true,
    actual: canApproveRegistration(admin),
  },
  {
    name: "Admin can assign roles",
    expected: true,
    actual: canAssignRoles(admin),
  },
  {
    name: "Instructor cannot assign roles",
    expected: false,
    actual: canAssignRoles(instructor),
  },
  {
    name: "Valid grades are accepted",
    expected: true,
    actual: isValidGrade(18, 42),
  },
  {
    name: "Grades above the allowed maximum are rejected",
    expected: false,
    actual: isValidGrade(25, 55),
  },
];

let passedCount = 0;

tests.forEach((test) => {
  const passed = test.actual === test.expected;

  if (passed) passedCount++;

  console.log(`${passed ? "PASS" : "FAIL"}: ${test.name}`);
});

console.log(`\nResults: ${passedCount}/${tests.length} tests passed.`);


import {
  canViewGrade,
  canEditGrade,
  canManageUsers,
  canApproveRegistration,
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
    name: "Admin can manage users",
    expected: true,
    actual: canManageUsers(admin),
  },
  {
    name: "Admin can approve registrations",
    expected: true,
    actual: canApproveRegistration(admin),
  },
];

tests.forEach((test) => {
  const passed = test.actual === test.expected;

  console.log(
    `${passed ? "PASS" : "FAIL"}: ${test.name}`
  );
});

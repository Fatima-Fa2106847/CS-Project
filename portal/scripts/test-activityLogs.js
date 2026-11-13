import prisma from "../lib/prisma.js";

import {
  logActivity,
  getUserActivity,
  getAllActivity,
} from "../lib/security/activityLogs.js";

// Create a temporary test user
const user = await prisma.user.create({
  data: {
    name: "Log Test Student",
    email: `log-test-${Date.now()}@example.com`,
    passwordHash: "TEST_ONLY_NOT_A_REAL_PASSWORD_HASH",
    role: "STUDENT",
    status: "ACTIVE",
  },
});

try {
  // Test 1: Save an activity
  const log = await logActivity(
    "LOGIN_SUCCESS",
    true,
    user.id,
    null,
    "Test login"
  );

  console.log("TEST 1: Activity saved");
  console.log(log.action === "LOGIN_SUCCESS" ? "PASS" : "FAIL");

  // Test 2: Get one user's activity
  const userLogs = await getUserActivity(user.id);

  console.log("TEST 2: User activity retrieved");
  console.log(
    userLogs.some((item) => item.id === log.id) ? "PASS" : "FAIL"
  );

  // Test 3: Get all activity
  const allLogs = await getAllActivity();

  console.log("TEST 3: All activity retrieved");
  console.log(
    allLogs.some((item) => item.id === log.id) ? "PASS" : "FAIL"
  );
} finally {
  // Remove temporary test records
  await prisma.activityLog.deleteMany({
    where: { userId: user.id },
  });

  await prisma.user.delete({
    where: { id: user.id },
  });

  await prisma.$disconnect();
}

console.log("Activity log tests completed!");
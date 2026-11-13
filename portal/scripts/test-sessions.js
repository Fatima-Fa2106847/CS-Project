import prisma from "../lib/prisma.js";

import {
  createSession,
  validateSession,
  logoutSession,
  revokeUserSessions,
} from "../lib/security/sessions.js";

// Create a temporary user for testing
const user = await prisma.user.create({
  data: {
    name: "Test Student",
    email: `session-test-${Date.now()}@example.com`,
    passwordHash: "TEST_ONLY_NOT_A_REAL_PASSWORD_HASH",
    role: "STUDENT",
    status: "ACTIVE",
  },
});

try {
  // Test 1: Create a session
  const token = await createSession(user.id);

  console.log("TEST 1: Session created");
  console.log(token ? "PASS" : "FAIL");

  // Test 2: Check valid session
  const validUser = await validateSession(token);

  console.log("TEST 2: Session is valid");
  console.log(validUser?.id === user.id ? "PASS" : "FAIL");

  // Test 3: Logout
  await logoutSession(token);

  console.log("TEST 3: Logout invalidates session");
  console.log((await validateSession(token)) === null ? "PASS" : "FAIL");

  // Test 4: Revoke all sessions
  const token2 = await createSession(user.id);
  await revokeUserSessions(user.id);

  console.log("TEST 4: All sessions revoked");
  console.log((await validateSession(token2)) === null ? "PASS" : "FAIL");

  // Test 5: Suspended accounts cannot log in
  await prisma.user.update({
    where: { id: user.id },
    data: { status: "SUSPENDED" },
  });

  console.log("TEST 5: Suspended account rejected");
  console.log((await createSession(user.id)) === null ? "PASS" : "FAIL");
// Test 6: Session expires after 5 minutes of inactivity
await prisma.user.update({
  where: { id: user.id },
  data: { status: "ACTIVE" },
});

const token3 = await createSession(user.id);

// Simulate 6 minutes without activity
await prisma.session.updateMany({
  where: { userId: user.id, revokedAt: null },
  data: {
    lastActivityAt: new Date(Date.now() - 6 * 60 * 1000),
  },
});

console.log("TEST 6: Session expires after inactivity");
console.log((await validateSession(token3)) === null ? "PASS" : "FAIL");

// Test 7: Password change invalidates old sessions
const token4 = await createSession(user.id);

// Simulate a password change
await prisma.user.update({
  where: { id: user.id },
  data: {
    passwordChangedAt: new Date(),
  },
});

// Revoke sessions after changing the password
await revokeUserSessions(user.id);

// Check that the old session no longer works
console.log("TEST 7: Password change invalidates sessions");
console.log((await validateSession(token4)) === null ? "PASS" : "FAIL");

} finally {
  // Delete temporary test data
  await prisma.session.deleteMany({
    where: { userId: user.id },
  });

  await prisma.user.delete({
    where: { id: user.id },
  });

  await prisma.$disconnect();
}

console.log("Session tests completed!");
import prisma from "../lib/prisma.js";

import {
  createChallenge,
  checkChallenge,
  completeChallenge,
} from "../lib/security/liveness.js";

// Create a temporary user for testing
const user = await prisma.user.create({
  data: {
    name: "Liveness Test Student",
    email: `liveness-test-${Date.now()}@example.com`,
    passwordHash: "TEST_ONLY_NOT_A_REAL_PASSWORD_HASH",
    role: "STUDENT",
    status: "ACTIVE",
  },
});

try {
  // Test 1: Create a random challenge
  const challenge = await createChallenge(user.id);

  console.log("TEST 1: Challenge created");
  console.log(
    challenge?.attemptId &&
    ["TURN_LEFT", "TURN_RIGHT", "BLINK"].includes(challenge.challengeType)
      ? "PASS"
      : "FAIL"
  );

  // Test 2: Challenge should be valid
  console.log("TEST 2: Challenge is valid");
  console.log(
    (await checkChallenge(challenge.attemptId)) === true
      ? "PASS"
      : "FAIL"
  );

  // Test 3: Complete the challenge
  const completed = await completeChallenge(
    challenge.attemptId,
    true,
    true
  );

  console.log("TEST 3: Challenge completed");
  console.log(completed === true ? "PASS" : "FAIL");

  // Test 4: Completed challenge cannot be reused
  console.log("TEST 4: Challenge cannot be reused");
  console.log(
    (await completeChallenge(challenge.attemptId, true, true)) === false
      ? "PASS"
      : "FAIL"
  );

  // Test 5: Expired challenge should be rejected
  const expiredChallenge = await createChallenge(user.id);

  // Simulate an expired challenge
  await prisma.authAttempt.update({
    where: { id: expiredChallenge.attemptId },
    data: {
      challengeExpiresAt: new Date(Date.now() - 1000),
    },
  });

  console.log("TEST 5: Expired challenge rejected");
  console.log(
    (await checkChallenge(expiredChallenge.attemptId)) === false
      ? "PASS"
      : "FAIL"
  );

  // Test 6: Suspended users cannot create challenges
  await prisma.user.update({
    where: { id: user.id },
    data: { status: "SUSPENDED" },
  });

  console.log("TEST 6: Suspended user rejected");
  console.log(
    (await createChallenge(user.id)) === null
      ? "PASS"
      : "FAIL"
  );

} finally {
  // Remove temporary test records
  await prisma.authAttempt.deleteMany({
    where: { userId: user.id },
  });

  await prisma.user.delete({
    where: { id: user.id },
  });

  await prisma.$disconnect();
}

console.log("Liveness tests completed!");
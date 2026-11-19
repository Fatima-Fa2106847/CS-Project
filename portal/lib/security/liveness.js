
import crypto from "node:crypto";
import prisma from "../prisma.js";

// User has 15 seconds to complete the challenge.
const CHALLENGE_TIME = 15 * 1000;

// Available liveness challenges.
const challenges = [
  "TURN_LEFT",
  "TURN_RIGHT",
  "BLINK",
];

// Generate a random liveness challenge.
export async function createChallenge(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // Only active accounts can start verification.
  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  // Select a random challenge.
  const randomIndex = crypto.randomInt(challenges.length);
  const challengeType = challenges[randomIndex];

  // Save challenge in the database.
  const attempt = await prisma.authAttempt.create({
    data: {
      userId,
      challengeType,
      challengeExpiresAt: new Date(
        Date.now() + CHALLENGE_TIME
      ),
    },
  });

  return {
    attemptId: attempt.id,
    challengeType: attempt.challengeType,
    expiresAt: attempt.challengeExpiresAt.getTime(),
  };
}

// Check whether a challenge is valid.
export async function checkChallenge(attemptId) {
  const attempt = await prisma.authAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    return false;
  }

  // Reject expired or previously completed challenges.
  if (
    attempt.challengeUsedAt !== null ||
    Date.now() >= attempt.challengeExpiresAt.getTime() ||
    attempt.success === true ||
    attempt.faceMatched !== null ||
    attempt.livenessPassed !== null
  ) {
    return false;
  }

  return true;
}

// Save the actual verification results.
// The authentication service will consume the challenge
// when it successfully activates the login session.
export async function completeChallenge(
  attemptId,
  faceMatched,
  livenessPassed
) {
  if (
    !Number.isInteger(attemptId) ||
    typeof faceMatched !== "boolean" ||
    typeof livenessPassed !== "boolean"
  ) {
    return false;
  }

  const result = await prisma.authAttempt.updateMany({
    where: {
      id: attemptId,
      challengeUsedAt: null,
      challengeExpiresAt: {
        gt: new Date(),
      },
      faceMatched: null,
      livenessPassed: null,
      success: false,
    },
    data: {
      faceMatched,
      livenessPassed,
      success:
        faceMatched === true &&
        livenessPassed === true,
    },
  });

  return result.count === 1;
}

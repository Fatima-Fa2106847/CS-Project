import crypto from "node:crypto";
import prisma from "../prisma.js";

// User must complete the challenge within 15 seconds
const CHALLENGE_TIME = 15 * 1000;

// Possible movements for the user
const challenges = ["TURN_LEFT", "TURN_RIGHT", "BLINK"];

// Create a random challenge for the user
export async function createChallenge(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // Only active users can start authentication
  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  // Choose a random movement
  const randomIndex = crypto.randomInt(challenges.length);
  const challengeType = challenges[randomIndex];

  // Save the challenge in the database
  const attempt = await prisma.authAttempt.create({
    data: {
      userId,
      challengeType,
      challengeExpiresAt: new Date(Date.now() + CHALLENGE_TIME),
    },
  });

  return {
    attemptId: attempt.id,
    challengeType: attempt.challengeType,
  };
}

// Check whether a challenge can still be used
export async function checkChallenge(attemptId) {
  const attempt = await prisma.authAttempt.findUnique({
    where: { id: attemptId },
  });

  if (!attempt) {
    return false;
  }

  // Reject expired or already used challenges
  if (
    attempt.challengeUsedAt ||
    Date.now() >= attempt.challengeExpiresAt.getTime()
  ) {
    return false;
  }

  return true;
}

// Save the face recognition and liveness results
export async function completeChallenge(
  attemptId,
  faceMatched,
  livenessPassed
) {
  // Accept the challenge only once and before its deadline
  const result = await prisma.authAttempt.updateMany({
    where: {
      id: attemptId,
      challengeUsedAt: null,
      challengeExpiresAt: { gt: new Date() },
    },
    data: {
      challengeUsedAt: new Date(),
      faceMatched,
      livenessPassed,
      success: faceMatched === true && livenessPassed === true,
    },
  });

  // If no record was updated, the challenge was invalid
  return result.count === 1;
}
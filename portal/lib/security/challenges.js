import { randomBytes, createHash } from "node:crypto";

const CHALLENGE_DURATION = 60 * 1000;

// Generate a random authentication challenge.
export function generateChallenge() {
  return randomBytes(32).toString("hex");
}

// Hash the challenge before storing it in the database.
export function hashChallenge(challenge) {
  return createHash("sha256")
    .update(challenge)
    .digest("hex");
}

// Set the challenge expiration time.
export function getChallengeExpiration() {
  return new Date(Date.now() + CHALLENGE_DURATION);
}

// Check whether a challenge has expired.
export function isChallengeExpired(expiresAt) {
  return expiresAt.getTime() <= Date.now();
}
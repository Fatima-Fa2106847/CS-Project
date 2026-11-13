import crypto from "node:crypto";
import prisma from "../prisma.js";

// Log out users after 5 minutes without activity
const INACTIVITY_LIMIT = 5 * 60 * 1000;

// Hash the session token before saving it
function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Create a session after the user finishes logging in
export async function createSession(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  // Only active accounts can log in
  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  // Generate a random token
  const token = crypto.randomBytes(32).toString("hex");
  const now = new Date();

  // Save the session in the database
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      lastActivityAt: now,
      expiresAt: new Date(now.getTime() + INACTIVITY_LIMIT),
    },
  });

  // Return the token so the login route can set a secure cookie
  return token;
}

// Check whether a session is still valid
export async function validateSession(token) {
  if (typeof token !== "string" || !token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  // Reject revoked sessions and suspended accounts
  if (session.revokedAt || session.user.status !== "ACTIVE") {
    return null;
  }

  const now = new Date();

  // Reject expired or inactive sessions
  if (
    now >= session.expiresAt ||
    now.getTime() - session.lastActivityAt.getTime() >= INACTIVITY_LIMIT
  ) {
    return null;
  }

  // Update the activity time when the user makes a valid request
  await prisma.session.update({
    where: { id: session.id },
    data: {
      lastActivityAt: now,
      expiresAt: new Date(now.getTime() + INACTIVITY_LIMIT),
    },
  });

  return session.user;
}

// Log out by revoking the session
export async function logoutSession(token) {
  if (typeof token !== "string" || !token) {
    return;
  }

  await prisma.session.updateMany({
    where: { tokenHash: hashToken(token) },
    data: { revokedAt: new Date() },
  });
}

// Revoke all sessions after password changes or account suspension
export async function revokeUserSessions(userId) {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
}
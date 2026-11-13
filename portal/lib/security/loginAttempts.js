import prisma from "../prisma.js";

// Maximum failed attempts and cooldown time
const MAX_ATTEMPTS = 3;
const COOLDOWN_TIME = 30 * 1000;

// Check if the user is temporarily blocked
export async function isLocked(email) {
  const user = await prisma.loginAttempt.findUnique({
    where: { email },
  });

  if (!user || !user.lockedUntil) {
    return false;
  }

  return Date.now() < user.lockedUntil.getTime();
}

// Record a failed login
export async function recordFailedAttempt(email, userId = null, ipAddress = null) {
  const user = await prisma.loginAttempt.findUnique({
    where: { email },
  });

  // Do not count more attempts during cooldown
  if (user?.lockedUntil && Date.now() < user.lockedUntil.getTime()) {
    return;
  }

  let attempts = user?.failedCount || 0;

  // Reset the counter when cooldown ends
  if (user?.lockedUntil && Date.now() >= user.lockedUntil.getTime()) {
    attempts = 0;
  }

  attempts++;

  // Block login for 30 seconds after 3 failures
  const lockedUntil =
    attempts >= MAX_ATTEMPTS
      ? new Date(Date.now() + COOLDOWN_TIME)
      : null;

  // Save the failed attempt in the database
  await prisma.loginAttempt.upsert({
    where: { email },
    update: {
      failedCount: attempts,
      lastFailedAt: new Date(),
      lockedUntil,
      lastIpAddress: ipAddress,
      ...(userId !== null ? { userId } : {}),
    },
    create: {
      email,
      userId,
      failedCount: attempts,
      lastFailedAt: new Date(),
      lockedUntil,
      lastIpAddress: ipAddress,
    },
  });
}

// Reset attempts after successful login
export async function resetAttempts(email) {
  await prisma.loginAttempt.deleteMany({
    where: { email },
  });
}
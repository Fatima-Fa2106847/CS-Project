import prisma from "../prisma.js";

// Save an important action in the database
export async function logActivity(
  action,
  success,
  userId = null,
  targetUserId = null,
  details = null,
  ipAddress = null
) {
  // Create a new record in the ActivityLog table
  return await prisma.activityLog.create({
    data: {
      action,
      success,
      userId,
      targetUserId,
      details,
      ipAddress,
    },
  });
}

// Get the activity history of one user
export async function getUserActivity(userId) {
  return await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

// Get all activity records (for authorized security/admin use)
export async function getAllActivity() {
  return await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
  });
}
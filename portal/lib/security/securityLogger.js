// @ts-check

import prisma from "../prisma.js";

/**
 * @param {{
 *   userId?: number | null,
 *   action: string,
 *   success: boolean,
 *   details?: string | null
 * }} event
 */
export async function logSecurityEvent({
  userId = null,
  action,
  success,
  details = null,
}) {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      success,
      details,
    },
  });
}
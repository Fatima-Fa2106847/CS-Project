import { getAuthenticatedAdmin } from "../../../../lib/admin-auth";
import {
  approveStudentRegistration,
  getManagedUsers,
} from "../../../../lib/auth-service";
import { getUserForSession } from "../../../../lib/auth-service";
import { logSecurityEvent } from "../../../../lib/security/securityLogger.js";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import prisma from "../../../../lib/prisma.js";
import { AUTH_SESSION_COOKIE } from "../../../../lib/auth-constants";

// Record denied administrator access without storing session tokens.
async function logDeniedAdminAccess() {
  try {
    const cookieStore = await cookies();

    // Use the same cookie name as the authentication system.
    const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

    let userId: number | null = null;

    if (token) {
      const tokenHash = createHash("sha256")
        .update(token)
        .digest("hex");

      const session = await prisma.session.findUnique({
        where: { tokenHash },
      });

      // Only associate the log with a valid, active session.
      if (
        session &&
        session.status === "ACTIVE" &&
        session.revokedAt === null &&
        session.expiresAt.getTime() > Date.now()
      ) {
        userId = session.userId;
      }
    }

    await logSecurityEvent({
      userId,
      action: "ADMIN_ACCESS_DENIED",
      success: false,
      details: "Unauthorized attempt to access administrator API.",
    });
  } catch (error) {
    console.error("Failed to record denied admin access:", error);
  }
}

export async function GET() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    await logDeniedAdminAccess();

    return Response.json(
      { message: "Administrator access required." },
      { status: 403 }
    );
  }

  return Response.json({ users: await getManagedUsers() });
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    await logDeniedAdminAccess();

    return Response.json(
      { message: "Administrator access required." },
      { status: 403 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { message: "Invalid approval request." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("userId" in body) ||
    typeof body.userId !== "string" ||
    !body.userId.trim() ||
    body.userId.length > 64
  ) {
    return Response.json(
      { message: "A valid user ID is required." },
      { status: 400 }
    );
  }

  const approved = await approveStudentRegistration(body.userId);

  if (!approved) {
    return Response.json(
      {
        message:
          "No pending student registration was found for that ID.",
      },
      { status: 409 }
    );
  }

  return Response.json({ message: "Student account approved." });
}
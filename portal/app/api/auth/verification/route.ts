import { cookies } from "next/headers";

import {
  completeAuthVerification,
  deleteAuthSession,
  getUserForSession,
  getUserForVerification,
} from "../../../../lib/auth-service";
import { AUTH_SESSION_COOKIE } from "../../../../lib/auth-constants";
import {
  isSessionRole,
  type SessionRole,
} from "../../../../lib/sessions";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (!token) {
    return Response.json({ message: "No pending verification." }, { status: 401 });
  }

  const user = await getUserForVerification(token);
  if (!user) {
    if (await getUserForSession(token)) {
      return Response.json(
        { message: "This account has already been verified." },
        { status: 403 }
      );
    }

    await deleteAuthSession(token);
    cookieStore.delete(AUTH_SESSION_COOKIE);
    return Response.json({ message: "Verification session expired." }, { status: 401 });
  }

  return Response.json({
    userId: user.id,
    name: user.name,
    role: user.role,
    enrolledCourses: user.enrolledCourses,
    assignedCourses: user.assignedCourses,
    expiresAt: user.expiresAt,
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid verification request." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("role" in body) ||
    !isSessionRole(body.role)
  ) {
    return Response.json({ message: "Invalid verification role." }, { status: 400 });
  }

  const role: SessionRole = body.role;
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (!token) {
    return Response.json({ message: "No pending verification." }, { status: 401 });
  }

  if (!(await completeAuthVerification(token, role))) {
    return Response.json(
      { message: "Verification does not match the account role or has not been completed." },
      { status: 403 }
    );
  }

  return Response.json({ success: true });
}
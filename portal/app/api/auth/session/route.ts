import { cookies } from "next/headers";

import {
  deleteAuthSession,
  getUserForVerification,
  getUserForSession,
} from "../../../../lib/auth-service";
import { AUTH_SESSION_COOKIE } from "../../../../lib/auth-constants";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (!token) {
    return Response.json({ message: "Not signed in." }, { status: 401 });
  }

  const user = await getUserForSession(token);
  if (!user) {
    if (await getUserForVerification(token)) {
      return Response.json(
        { message: "Complete verification before accessing your dashboard." },
        { status: 403 }
      );
    }

    await deleteAuthSession(token);
    cookieStore.delete(AUTH_SESSION_COOKIE);
    return Response.json({ message: "Session expired." }, { status: 401 });
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
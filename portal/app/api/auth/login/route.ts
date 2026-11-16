import { cookies } from "next/headers";

import {
  authenticateUser,
  createAuthSession,
} from "../../../../lib/database";
import {
  AUTH_SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
} from "../../../../lib/auth-constants";
import { isSessionRole } from "../../../../lib/sessions";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid login request." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("userId" in body) ||
    typeof body.userId !== "string" ||
    !("password" in body) ||
    typeof body.password !== "string"
  ) {
    return Response.json({ message: "Enter your ID and password." }, { status: 400 });
  }

  const userId = body.userId.trim();
  if (!userId || userId.length > 64 || body.password.length > 256) {
    return Response.json({ message: "Enter a valid ID and password." }, { status: 400 });
  }

  const result = authenticateUser(userId, body.password);

  if (!result.success) {
    if (result.reason === "locked") {
      return Response.json(
        { message: "Too many failed attempts. Your account is locked for 1 minute." },
        { status: 429 }
      );
    }

    if (result.reason === "pending") {
      return Response.json(
        { message: "Your account is awaiting administrator approval." },
        { status: 403 }
      );
    }

    return Response.json(
      { message: "Incorrect university ID or password." },
      { status: 401 }
    );
  }

  if (!isSessionRole(result.user.role)) {
    return Response.json(
      { message: "This account has an unsupported role." },
      { status: 403 }
    );
  }

  const { token } = createAuthSession(
    result.user.id,
    result.user.role !== "admin"
  );
  const cookieStore = await cookies();

  cookieStore.set(AUTH_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return Response.json({
    user: {
      id: result.user.id,
      role: result.user.role,
    },
  });
}

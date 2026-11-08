import { cookies } from "next/headers";

import { AUTH_SESSION_COOKIE } from "./auth-constants";
import { getUserForSession } from "./database";

export async function getAuthenticatedAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (!token) return null;

  const user = getUserForSession(token);
  return user?.role === "admin" ? user : null;
}

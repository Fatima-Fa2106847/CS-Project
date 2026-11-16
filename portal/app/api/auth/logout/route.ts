import { cookies } from "next/headers";

import { deleteAuthSession } from "../../../../lib/database";
import { AUTH_SESSION_COOKIE } from "../../../../lib/auth-constants";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (token) {
    deleteAuthSession(token);
  }

  cookieStore.delete(AUTH_SESSION_COOKIE);
  return Response.json({ success: true });
}

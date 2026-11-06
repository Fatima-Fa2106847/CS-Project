
export type SessionRole = "student" | "instructor" | "admin";

export type PortalSession = {
  userId: string;
  role: SessionRole;
  expiresAt: number;
};

const SESSION_KEY = "university_portal_session";
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export function createSession(
  userId: string,
  role: SessionRole
) {
  const session: PortalSession = {
    userId,
    role,
    expiresAt: Date.now() + SESSION_DURATION,
  };

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): PortalSession | null {
  const storedSession = sessionStorage.getItem(SESSION_KEY);

  if (!storedSession) {
    return null;
  }

  try {
    const session = JSON.parse(storedSession) as PortalSession;

    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }

    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

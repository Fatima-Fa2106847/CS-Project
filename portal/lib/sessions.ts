
export type SessionRole = "student" | "instructor" | "admin";

export type PortalSession = {
  userId: string;
  role: SessionRole;
  expiresAt: number;
};

const SESSION_KEY = "university_portal_session";
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

const VALID_ROLES: SessionRole[] = [
  "student",
  "instructor",
  "admin",
];

// Create a new session
export function createSession(
  userId: string,
  role: SessionRole
): void {
  if (typeof window === "undefined") return;

  const normalizedId = userId.trim();

  if (!normalizedId || !VALID_ROLES.includes(role)) {
    return;
  }

  const session: PortalSession = {
    userId: normalizedId,
    role,
    expiresAt: Date.now() + SESSION_DURATION,
  };

  try {
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify(session)
    );
  } catch {
    clearSession();
  }
}

// Retrieve and validate an existing session
export function getSession(): PortalSession | null {
  if (typeof window === "undefined") return null;

  try {
    const storedSession = sessionStorage.getItem(SESSION_KEY);

    if (!storedSession) return null;

    const session = JSON.parse(storedSession);

    const validSession =
      session !== null &&
      typeof session === "object" &&
      typeof session.userId === "string" &&
      session.userId.trim().length > 0 &&
      VALID_ROLES.includes(session.role) &&
      typeof session.expiresAt === "number" &&
      Number.isFinite(session.expiresAt);

    if (!validSession || Date.now() >= session.expiresAt) {
      clearSession();
      return null;
    }

    return session as PortalSession;
  } catch {
    clearSession();
    return null;
  }
}

// Clear the current session
export function clearSession(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Storage may be unavailable.
  }
}

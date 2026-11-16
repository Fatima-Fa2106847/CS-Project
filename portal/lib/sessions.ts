
export type SessionRole = "student" | "instructor" | "admin";

export type PortalSession = {
  userId: string;
  name: string;
  role: SessionRole;
  enrolledCourses: string[];
  assignedCourses: string[];
  expiresAt: number;
};

export function isSessionRole(value: unknown): value is SessionRole {
  return value === "student" || value === "instructor" || value === "admin";
}

export function getDashboardPath(role: SessionRole): string {
  switch (role) {
    case "student":
      return "/student-dashboard";
    case "instructor":
      return "/instructor-dashboard";
    case "admin":
      return "/admin-dashboard";
  }
}

async function readSession(response: Response): Promise<PortalSession | null> {
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new Error("Unable to verify the user session.");
  }

  const session: unknown = await response.json();

  if (
    typeof session !== "object" ||
    session === null ||
    !("userId" in session) ||
    typeof session.userId !== "string" ||
    !("name" in session) ||
    typeof session.name !== "string" ||
    !("role" in session) ||
    !isSessionRole(session.role) ||
    !("enrolledCourses" in session) ||
    !Array.isArray(session.enrolledCourses) ||
    !session.enrolledCourses.every((course) => typeof course === "string") ||
    !("assignedCourses" in session) ||
    !Array.isArray(session.assignedCourses) ||
    !session.assignedCourses.every((course) => typeof course === "string") ||
    !("expiresAt" in session) ||
    typeof session.expiresAt !== "number"
  ) {
    throw new Error("The session service returned an invalid response.");
  }

  return session as PortalSession;
}

export async function getSession(): Promise<PortalSession | null> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  return readSession(response);
}

export async function getPendingSession(): Promise<PortalSession | null> {
  const response = await fetch("/api/auth/verification", {
    cache: "no-store",
  });
  return readSession(response);
}

export async function completeVerification(
  role: Exclude<SessionRole, "admin">
): Promise<void> {
  const response = await fetch("/api/auth/verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    throw new Error("Unable to complete account verification.");
  }
}

export async function clearSession(): Promise<void> {
  const response = await fetch("/api/auth/logout", { method: "POST" });

  if (!response.ok) {
    throw new Error("Unable to end the current user session.");
  }
}

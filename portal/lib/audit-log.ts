
export type AuditEvent = {
  id: string;
  userId: string;
  userRole: "student" | "instructor" | "admin";
  action: string;
  details: string;
  status: "SUCCESS" | "DENIED";
  timestamp: string;
};

const STORAGE_KEY = "university_portal_audit_logs";
const MAX_LOGS = 500;

// Record a security event
export function recordAuditEvent(
  event: Omit<AuditEvent, "id" | "timestamp">
): void {
  if (typeof window === "undefined") return;

  try {
    if (
      !event ||
      typeof event.userId !== "string" ||
      !event.userId.trim() ||
      !["student", "instructor", "admin"].includes(event.userRole) ||
      !event.action.trim() ||
      !event.details.trim() ||
      !["SUCCESS", "DENIED"].includes(event.status)
    ) {
      return;
    }

    const existingLogs = getAuditEvents();

    const newEvent: AuditEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    const updatedLogs = [
      newEvent,
      ...existingLogs,
    ].slice(0, MAX_LOGS);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updatedLogs)
    );
  } catch (error) {
    console.error("Unable to record audit event:", error);
  }
}

// Retrieve recorded security events
export function getAuditEvents(): AuditEvent[] {
  if (typeof window === "undefined") return [];

  try {
    const savedLogs = localStorage.getItem(STORAGE_KEY);

    if (!savedLogs) return [];

    const parsedLogs = JSON.parse(savedLogs);

    if (!Array.isArray(parsedLogs)) return [];

    return parsedLogs.filter((event): event is AuditEvent => {
      return (
        event !== null &&
        typeof event === "object" &&
        typeof event.id === "string" &&
        typeof event.userId === "string" &&
        typeof event.userRole === "string" &&
        ["student", "instructor", "admin"].includes(event.userRole) &&
        typeof event.action === "string" &&
        typeof event.details === "string" &&
        ["SUCCESS", "DENIED"].includes(event.status) &&
        typeof event.timestamp === "string" &&
        !Number.isNaN(Date.parse(event.timestamp))
      );
    });
  } catch {
    return [];
  }
}

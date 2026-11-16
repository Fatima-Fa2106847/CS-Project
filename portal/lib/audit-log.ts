import type { SessionRole } from "./sessions";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "APPROVE_REGISTRATION"
  | "EDIT_GRADE";

export type AuditEventInput = {
  userId: string;
  userRole: SessionRole;
  action: AuditAction;
  details: string;
  status: "SUCCESS" | "DENIED";
};

export type AuditEvent = AuditEventInput & {
  id: string;
  timestamp: string;
};

const STORAGE_KEY = "university_portal_audit_events";
const MAX_AUDIT_EVENTS = 500;

function isAuditEvent(value: unknown): value is AuditEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "timestamp" in value &&
    typeof value.timestamp === "string" &&
    "userId" in value &&
    typeof value.userId === "string" &&
    "userRole" in value &&
    (value.userRole === "student" ||
      value.userRole === "instructor" ||
      value.userRole === "admin") &&
    "action" in value &&
    (value.action === "LOGIN" ||
      value.action === "LOGOUT" ||
      value.action === "APPROVE_REGISTRATION" ||
      value.action === "EDIT_GRADE") &&
    "details" in value &&
    typeof value.details === "string" &&
    "status" in value &&
    (value.status === "SUCCESS" || value.status === "DENIED")
  );
}

export function getAuditEvents(): AuditEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedEvents = window.localStorage.getItem(STORAGE_KEY);
  if (storedEvents === null) {
    return [];
  }

  let parsedEvents: unknown;
  try {
    parsedEvents = JSON.parse(storedEvents);
  } catch {
    throw new Error("Stored audit events are not valid JSON.");
  }

  if (!Array.isArray(parsedEvents) || !parsedEvents.every(isAuditEvent)) {
    throw new Error("Stored audit events have an invalid format.");
  }

  return parsedEvents;
}

export function recordAuditEvent(event: AuditEventInput): void {
  if (typeof window === "undefined") {
    return;
  }

  const events = getAuditEvents();
  events.unshift({
    ...event,
    id: window.crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  });

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(events.slice(0, MAX_AUDIT_EVENTS))
  );
}

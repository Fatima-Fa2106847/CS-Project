
export type AuditEvent = {
  id: string;
  userId: string;
  userRole: string;
  action: string;
  details: string;
  status: "SUCCESS" | "DENIED";
  timestamp: string;
};

const STORAGE_KEY = "university_portal_audit_logs";

// Record a security event in the browser demo.
export function recordAuditEvent(
  event: Omit<AuditEvent, "id" | "timestamp">
) {
  if (typeof window === "undefined") return;

  const existingLogs = getAuditEvents();

  const newEvent: AuditEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date().toLocaleString(),
  };

  const updatedLogs = [newEvent, ...existingLogs];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedLogs)
  );
}

// Retrieve recorded events.
export function getAuditEvents(): AuditEvent[] {
  if (typeof window === "undefined") return [];

  const savedLogs = localStorage.getItem(STORAGE_KEY);

  if (!savedLogs) return [];

  try {
    return JSON.parse(savedLogs) as AuditEvent[];
  } catch {
    return [];
  }
}

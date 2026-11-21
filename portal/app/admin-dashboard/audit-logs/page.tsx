"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getDashboardPath,
  getSession,
} from "../../../lib/sessions";

// Structure of logs returned by our database API
type AuditLog = {
  id: number;
  userId: number | null;
  action: string;
  success: boolean;
  details: string | null;
  createdAt: string;
};

export default function AuditLogsPage() {
  const router = useRouter();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");

  // Get security logs from the database API
  const loadLogs = useCallback(async () => {
    try {
      setError("");

      const response = await fetch("/api/admin/audit-logs", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load security logs.");
      }

      const data = await response.json();
      setLogs(data.logs);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      setError("Unable to load security logs.");
    }
  }, []);

  useEffect(() => {
    void getSession()
      .then(async (session) => {
        if (!session) {
          router.replace("/login");
        } else if (session.role !== "admin") {
          router.replace(getDashboardPath(session.role));
        } else {
          await loadLogs();
          setIsCheckingSession(false);
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to verify administrator session:", error);
        router.replace("/login");
      });
  }, [router, loadLogs]);

  if (isCheckingSession) {
    return <p>Checking access...</p>;
  }

  return (
    <main
      style={{
        maxWidth: "1100px",
        margin: "40px auto",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <a href="/admin-dashboard">← Back to Dashboard</a>

      <h1 style={{ marginTop: "25px" }}>
        Security Audit Logs
      </h1>

      <p>
        Review recorded activities and security events
        in the University Grade Portal.
      </p>

      <section
        style={{
          marginTop: "30px",
          padding: "24px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h2>Recent Events</h2>

        <button
          onClick={() => void loadLogs()}
          style={{
            padding: "10px 18px",
            marginBottom: "20px",
            cursor: "pointer",
          }}
        >
          Refresh Logs
        </button>

        {error && (
          <p style={{ color: "red" }}>{error}</p>
        )}

        {!error && logs.length === 0 ? (
          <p>No security events have been recorded yet.</p>
        ) : !error ? (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
              }}
            >
              <thead>
                <tr>
                  {[
                    "User ID",
                    "Action",
                    "Details",
                    "Status",
                    "Timestamp",
                  ].map((heading) => (
                    <th key={heading} style={cellStyle}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={cellStyle}>
                      {log.userId ?? "Unknown"}
                    </td>

                    <td style={cellStyle}>
                      {log.action}
                    </td>

                    <td style={cellStyle}>
                      {log.details ?? "-"}
                    </td>

                    <td
                      style={{
                        ...cellStyle,
                        color: log.success ? "green" : "red",
                        fontWeight: "bold",
                      }}
                    >
                      {log.success ? "SUCCESS" : "DENIED"}
                    </td>

                    <td style={cellStyle}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #ddd",
};

"use client";

import { useEffect, useState } from "react";
import {
  getAuditEvents,
  type AuditEvent,
} from "../../../lib/audit-log";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditEvent[]>([]);

  useEffect(() => {
    setLogs(getAuditEvents());
  }, []);

  return (
    <main style={{
      maxWidth: "1100px",
      margin: "40px auto",
      padding: "32px",
      fontFamily: "Arial, sans-serif",
    }}>
      <a href="/admin-dashboard">← Back to Dashboard</a>

      <h1 style={{ marginTop: "25px" }}>
        Security Audit Logs
      </h1>

      <p>
        Review recorded activities and security events
        in the University Grade Portal.
      </p>

      <section style={{
        marginTop: "30px",
        padding: "24px",
        border: "1px solid #ddd",
        borderRadius: "12px",
      }}>
        <h2>Recent Events</h2>

        <button
          onClick={() => setLogs(getAuditEvents())}
          style={{
            padding: "10px 18px",
            marginBottom: "20px",
            cursor: "pointer",
          }}
        >
          Refresh Logs
        </button>

        {logs.length === 0 ? (
          <p>No security events have been recorded yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}>
              <thead>
                <tr>
                  {[
                    "User ID",
                    "Role",
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
                    <td style={cellStyle}>{log.userId}</td>
                    <td style={cellStyle}>{log.userRole}</td>
                    <td style={cellStyle}>{log.action}</td>
                    <td style={cellStyle}>{log.details}</td>
                    <td style={{
                      ...cellStyle,
                      color: log.status === "SUCCESS"
                        ? "green"
                        : "red",
                      fontWeight: "bold",
                    }}>
                      {log.status}
                    </td>
                    <td style={cellStyle}>{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #ddd",
};

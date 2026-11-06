
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { recordAuditEvent } from "../../lib/audit-log";
import { hasPermission } from "../../lib/permissions";
import { demoUsers } from "../../lib/demo-users";
import { getSession, clearSession } from "../../lib/sessions";

type ManagedUser = {
  id: string;
  name: string;
  role: string;
  status: string;
};

export default function AdminDashboard() {
  const router = useRouter();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [adminId, setAdminId] = useState("");
  const [users, setUsers] = useState<ManagedUser[]>([
    {
      id: "2021001",
      name: "Ahmed Ali",
      role: "Student",
      status: "Active",
    },
    {
      id: "2021002",
      name: "Sara Mohammed",
      role: "Student",
      status: "Active",
    },
    {
      id: "INS001",
      name: "Dr. Khalid",
      role: "Instructor",
      status: "Active",
    },
    {
      id: "2021003",
      name: "Omar Hassan",
      role: "Student",
      status: "Pending",
    },
  ]);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Verify administrator session
  useEffect(() => {
    const session = getSession();

    if (!session || session.role !== "admin") {
      router.replace("/admin-login");
      return;
    }

    const adminExists = demoUsers.some(
      (user) =>
        user.id === session.userId &&
        user.role === "admin"
    );

    if (!adminExists) {
      clearSession();
      router.replace("/admin-login");
      return;
    }

    setAdminId(session.userId);
    setIsCheckingSession(false);
  }, [router]);

  // Identify the authenticated administrator
  const currentAdmin = demoUsers.find(
    (user) =>
      user.id === adminId &&
      user.role === "admin"
  );

  const canManageAccounts = currentAdmin
    ? hasPermission(currentAdmin.role, "manage_users")
    : false;

  const canApprove = currentAdmin
    ? hasPermission(currentAdmin.role, "approve_registrations")
    : false;

  const canAssignRoles = currentAdmin
    ? hasPermission(currentAdmin.role, "assign_roles")
    : false;

  const canViewEvents = currentAdmin
    ? hasPermission(currentAdmin.role, "view_security_events")
    : false;

  // Logout
  function handleLogout() {
    if (currentAdmin) {
      recordAuditEvent({
        userId: currentAdmin.id,
        userRole: "admin",
        action: "LOGOUT",
        details: "Administrator logged out",
        status: "SUCCESS",
      });
    }

    clearSession();
    router.replace("/");
  }

  // Approve a pending registration
  function approveUser(id: string) {
    if (!currentAdmin || !canApprove) {
      recordAuditEvent({
        userId: adminId || "UNKNOWN",
        userRole: "admin",
        action: "APPROVE_REGISTRATION",
        details: `Unauthorized attempt to approve user ${id}`,
        status: "DENIED",
      });

      setMessageType("error");
      setMessage("Access denied: You cannot approve users.");
      return;
    }

    const targetUser = users.find((user) => user.id === id);

    if (!targetUser || targetUser.status !== "Pending") {
      setMessageType("error");
      setMessage("This user is not awaiting approval.");
      return;
    }

    setUsers((previous) =>
      previous.map((user) =>
        user.id === id
          ? { ...user, status: "Active" }
          : user
      )
    );

    recordAuditEvent({
      userId: currentAdmin.id,
      userRole: "admin",
      action: "APPROVE_REGISTRATION",
      details: `Approved registration for user ${id}`,
      status: "SUCCESS",
    });

    setMessageType("success");
    setMessage(`Registration for ${targetUser.name} approved successfully.`);
  }

  // Dashboard statistics
  const totalStudents = users.filter(
    (user) => user.role === "Student"
  ).length;

  const totalInstructors = users.filter(
    (user) => user.role === "Instructor"
  ).length;

  const pendingUsers = users.filter(
    (user) => user.status === "Pending"
  ).length;

  if (isCheckingSession) {
    return <p>Checking administrator access...</p>;
  }

  return (
    <main
      style={{
        maxWidth: "1000px",
        margin: "40px auto",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Administrator Dashboard</h1>

      <p>
        Welcome, {currentAdmin?.name}.
        Manage university portal accounts and permissions.
      </p>

      <button
        onClick={handleLogout}
        style={{
          padding: "10px 18px",
          backgroundColor: "#dc2626",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        Logout
      </button>

      {/* Dashboard statistics */}
      <section
        style={{
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          marginTop: "30px",
        }}
      >
        <div style={cardStyle}>
          <h3>Total Users</h3>
          <h2>{users.length}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Students</h3>
          <h2>{totalStudents}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Instructors</h3>
          <h2>{totalInstructors}</h2>
        </div>

        <div style={cardStyle}>
          <h3>Pending Approvals</h3>
          <h2>{pendingUsers}</h2>
        </div>
      </section>

      {/* User management */}
      {canManageAccounts && (
        <section style={sectionStyle}>
          <h2>User Management</h2>

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
                  <th style={cellStyle}>University ID</th>
                  <th style={cellStyle}>Name</th>
                  <th style={cellStyle}>Role</th>
                  <th style={cellStyle}>Status</th>
                  <th style={cellStyle}>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td style={cellStyle}>{user.id}</td>
                    <td style={cellStyle}>{user.name}</td>
                    <td style={cellStyle}>{user.role}</td>
                    <td style={cellStyle}>{user.status}</td>

                    <td style={cellStyle}>
                      {user.status === "Pending" && canApprove ? (
                        <button
                          onClick={() => approveUser(user.id)}
                          style={buttonStyle}
                        >
                          Approve
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {canAssignRoles && (
            <p style={{ marginTop: "20px" }}>
              Role assignment is reserved for administrators.
              Role editing is not yet implemented in this prototype.
            </p>
          )}

          {message && (
            <p
              style={{
                color: messageType === "success" ? "green" : "red",
                marginTop: "15px",
                fontWeight: "bold",
              }}
            >
              {message}
            </p>
          )}
        </section>
      )}

      {/* Security management */}
      {canViewEvents && (
        <section style={sectionStyle}>
          <h2>Security Management</h2>

          <p>
            Review login attempts and recent security events.
          </p>

          <a
            href="/admin-dashboard/audit-logs"
            style={{
              display: "inline-block",
              marginTop: "15px",
              padding: "10px 18px",
              backgroundColor: "#1d4ed8",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
            }}
          >
            View Audit Logs
          </a>

          <p>
            <strong>
              Administrators cannot access student grade values.
            </strong>
          </p>
        </section>
      )}

      <p
        style={{
          marginTop: "25px",
          color: "#777",
          fontSize: "13px",
        }}
      >
        Demonstration dashboard using fictional user data.
      </p>
    </main>
  );
}

const cardStyle = {
  padding: "20px",
  border: "1px solid #ddd",
  borderRadius: "10px",
  minWidth: "130px",
};

const sectionStyle = {
  marginTop: "35px",
  padding: "24px",
  border: "1px solid #ddd",
  borderRadius: "12px",
};

const cellStyle = {
  padding: "12px",
  borderBottom: "1px solid #ddd",
};

const buttonStyle = {
  padding: "8px 14px",
  backgroundColor: "#1d4ed8",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

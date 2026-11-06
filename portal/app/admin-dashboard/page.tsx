
"use client";

import Link from "next/link";
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

  // Identify authenticated administrator
  const currentAdmin = demoUsers.find(
    (user) =>
      user.id === adminId &&
      user.role === "admin"
  );

  // Check administrator permissions
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

  if (isCheckingSession || !currentAdmin) {
    return (
      <main className="portal-container" style={{ padding: "50px 20px" }}>
        <p>Checking administrator access...</p>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page">

      {/* Header */}
      <header className="admin-dashboard-header">
        <Link href="/" className="admin-dashboard-brand">
          <span className="admin-dashboard-brand-icon">U</span>
          <span>UniPortal</span>
        </Link>

        <button
          type="button"
          className="admin-dashboard-logout"
          onClick={handleLogout}
        >
          Logout →
        </button>
      </header>

      <div className="admin-dashboard-container">

        {/* Welcome section */}
        <section className="admin-dashboard-welcome">
          <div>
            <p className="admin-dashboard-eyebrow">
              ADMINISTRATOR PORTAL
            </p>

            <h1>Welcome, {currentAdmin.name}!</h1>

            <p>
              Manage university accounts, review registrations,
              and monitor portal security.
            </p>
          </div>

          <div className="admin-dashboard-welcome-icon">
            🛡️
          </div>
        </section>

        {/* Dashboard statistics */}
        <section className="admin-dashboard-stats">
          <div className="admin-dashboard-stat-card">
            <span className="admin-dashboard-stat-icon">👥</span>
            <div>
              <h3>{users.length}</h3>
              <p>Total Users</p>
            </div>
          </div>

          <div className="admin-dashboard-stat-card">
            <span className="admin-dashboard-stat-icon">🎓</span>
            <div>
              <h3>{totalStudents}</h3>
              <p>Students</p>
            </div>
          </div>

          <div className="admin-dashboard-stat-card">
            <span className="admin-dashboard-stat-icon">📚</span>
            <div>
              <h3>{totalInstructors}</h3>
              <p>Instructors</p>
            </div>
          </div>

          <div className="admin-dashboard-stat-card">
            <span className="admin-dashboard-stat-icon">⏳</span>
            <div>
              <h3>{pendingUsers}</h3>
              <p>Pending Approvals</p>
            </div>
          </div>
        </section>

        {/* User management */}
        {canManageAccounts && (
          <section className="admin-dashboard-section">
            <div className="admin-dashboard-section-heading">
              <div>
                <h2>User Management</h2>
                <p>Review university accounts and registration status.</p>
              </div>

              <span className="admin-dashboard-count">
                {users.length} Accounts
              </span>
            </div>

            <div className="admin-dashboard-table-wrapper">
              <table className="admin-dashboard-table">
                <thead>
                  <tr>
                    <th>University ID</th>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="admin-dashboard-user-id">
                        {user.id}
                      </td>

                      <td>{user.name}</td>

                      <td>
                        <span className="admin-dashboard-role">
                          {user.role}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            user.status === "Active"
                              ? "admin-status-active"
                              : "admin-status-pending"
                          }
                        >
                          {user.status}
                        </span>
                      </td>

                      <td>
                        {user.status === "Pending" && canApprove ? (
                          <button
                            type="button"
                            onClick={() => approveUser(user.id)}
                            className="admin-approve-button"
                          >
                            Approve
                          </button>
                        ) : (
                          <span className="admin-no-action">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {canAssignRoles && (
              <div className="admin-dashboard-role-note">
                <span>ℹ️</span>
                <p>
                  Role assignment is reserved for administrators.
                  Role editing is not yet implemented in this prototype.
                </p>
              </div>
            )}

            {message && (
              <div
                className={
                  messageType === "success"
                    ? "admin-dashboard-message-success"
                    : "admin-dashboard-message-error"
                }
                role="status"
              >
                {message}
              </div>
            )}
          </section>
        )}

        {/* Security management */}
        {canViewEvents && (
          <section className="admin-dashboard-security">
            <div className="admin-dashboard-security-icon">🔐</div>

            <div className="admin-dashboard-security-content">
              <p className="admin-dashboard-eyebrow">
                SECURITY MANAGEMENT
              </p>

              <h2>Monitor Portal Activity</h2>

              <p>
                Review login attempts and recent security events
                recorded by the portal.
              </p>

              <p className="admin-dashboard-security-warning">
                Administrators cannot access student grade values.
              </p>
            </div>

            <Link
              href="/admin-dashboard/audit-logs"
              className="admin-dashboard-audit-button"
            >
              View Audit Logs →
            </Link>
          </section>
        )}

        {/* Footer note */}
        <footer className="admin-dashboard-footer">
          UNIPORTAL · UNIVERSITY GRADE PORTAL
          <p>Demonstration dashboard using fictional user data.</p>
        </footer>

      </div>
    </main>
  );
}


"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { recordAuditEvent } from "../../lib/audit-log";
import { hasPermission } from "../../lib/permissions";
import {
  clearSession,
  getDashboardPath,
  getSession,
  type PortalSession,
} from "../../lib/sessions";

type ManagedUser = {
  id: string;
  name: string;
  role: string;
  status: "active" | "pending";
};

async function fetchManagedUsers(): Promise<ManagedUser[]> {
  const response = await fetch("/api/admin/users", { cache: "no-store" });
  const result: unknown = await response.json();

  if (!response.ok) {
    throw new Error("Unable to load registered accounts.");
  }

  if (
    typeof result !== "object" ||
    result === null ||
    !("users" in result) ||
    !Array.isArray(result.users) ||
    !result.users.every(
      (user) =>
        typeof user === "object" &&
        user !== null &&
        "id" in user &&
        typeof user.id === "string" &&
        "name" in user &&
        typeof user.name === "string" &&
        "role" in user &&
        typeof user.role === "string" &&
        "status" in user &&
        (user.status === "active" || user.status === "pending")
    )
  ) {
    throw new Error("The accounts service returned invalid data.");
  }

  return result.users;
}

export default function AdminDashboard() {
  const router = useRouter();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<PortalSession | null>(null);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [approvingUserId, setApprovingUserId] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  useEffect(() => {
    void getSession()
      .then((session) => {
        if (!session) {
          router.replace("/login");
        } else if (session.role !== "admin") {
          router.replace(getDashboardPath(session.role));
        } else {
          setCurrentAdmin(session);
          void fetchManagedUsers()
            .then((managedUsers) => {
              setUsers(managedUsers);
              setIsLoadingUsers(false);
              setIsCheckingSession(false);
            })
            .catch((error: unknown) => {
              console.error("Unable to load registered accounts:", error);
              setMessageType("error");
              setMessage("Unable to load registered accounts. Please refresh.");
              setIsLoadingUsers(false);
              setIsCheckingSession(false);
            });
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to verify administrator session:", error);
        router.replace("/login");
      });
  }, [router]);

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
  async function handleLogout() {
    if (currentAdmin) {
      recordAuditEvent({
        userId: currentAdmin.userId,
        userRole: "admin",
        action: "LOGOUT",
        details: "Administrator logged out",
        status: "SUCCESS",
      });
    }

    try {
      await clearSession();
      router.replace("/");
    } catch (error) {
      console.error("Unable to log out:", error);
    }
  }

  // Approve a pending registration
  async function approveUser(id: string) {
    if (!currentAdmin || !canApprove) {
      recordAuditEvent({
        userId: currentAdmin?.userId || "UNKNOWN",
        userRole: "admin",
        action: "APPROVE_REGISTRATION",
        details: `Unauthorized attempt to approve user ${id}`,
        status: "DENIED",
      });

      setMessageType("error");
      setMessage("Access denied: You cannot approve users.");
      return;
    }

    setApprovingUserId(id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof result.message === "string"
            ? result.message
            : "Unable to approve this account.";
        throw new Error(errorMessage);
      }

      const targetUser = users.find((user) => user.id === id);
      setUsers((previous) =>
        previous.map((user) =>
          user.id === id ? { ...user, status: "active" } : user
        )
      );

      recordAuditEvent({
        userId: currentAdmin.userId,
        userRole: "admin",
        action: "APPROVE_REGISTRATION",
        details: `Approved registration for user ${id}`,
        status: "SUCCESS",
      });

      setMessageType("success");
      setMessage(
        targetUser
          ? `Registration for ${targetUser.name} approved successfully.`
          : `Registration for ${id} approved successfully.`
      );
    } catch (error) {
      console.error("Unable to approve student registration:", error);
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to approve this account. Please try again."
      );
    } finally {
      setApprovingUserId("");
    }
  }

  // Dashboard statistics
  const totalStudents = users.filter(
    (user) => user.role === "student"
  ).length;

  const totalInstructors = users.filter(
    (user) => user.role === "instructor"
  ).length;

  const pendingUsers = users.filter(
    (user) => user.status === "pending"
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
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            user.status === "active"
                              ? "admin-status-active"
                              : "admin-status-pending"
                          }
                        >
                          {user.status === "active" ? "Active" : "Pending"}
                        </span>
                      </td>

                      <td>
                        {user.status === "pending" && canApprove ? (
                          <button
                            type="button"
                            onClick={() => approveUser(user.id)}
                            className="admin-approve-button"
                            disabled={approvingUserId === user.id}
                          >
                            {approvingUserId === user.id ? "Approving..." : "Approve"}
                          </button>
                        ) : (
                          <span className="admin-no-action">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!isLoadingUsers && users.length === 0 && (
                    <tr>
                      <td colSpan={5}>No accounts have been registered.</td>
                    </tr>
                  )}
                  {isLoadingUsers && (
                    <tr>
                      <td colSpan={5}>Loading accounts...</td>
                    </tr>
                  )}
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
          <p>Account registration and approval are stored in the portal database.</p>
        </footer>

      </div>
    </main>
  );
}

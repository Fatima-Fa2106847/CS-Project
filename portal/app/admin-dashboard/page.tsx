
"use client";

import { useState } from "react";
import {
  hasPermission,
} from "../../lib/permissions";
import { demoUsers } from "../../lib/demo-users";

export default function AdminDashboard() {
  const currentAdmin = demoUsers.find(
    (user) => user.role === "admin"
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

  const [users, setUsers] = useState([
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

  function approveUser(id: string) {
    if (!canApprove) {
      setMessage("Access denied: You cannot approve users.");
      return;
    }

    setUsers((previous) =>
      previous.map((user) =>
        user.id === id
          ? { ...user, status: "Active" }
          : user
      )
    );

    setMessage("Demo: User approval updated successfully.");
  }

  const totalStudents = users.filter(
    (user) => user.role === "Student"
  ).length;

  const totalInstructors = users.filter(
    (user) => user.role === "Instructor"
  ).length;

  const pendingUsers = users.filter(
    (user) => user.status === "Pending"
  ).length;

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
        Manage university portal accounts and permissions.
      </p>

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
              Role assignment is available to administrators.
              The role-editing function will be connected later.
            </p>
          )}

          {message && (
            <p style={{ color: "green", marginTop: "15px" }}>
              {message}
            </p>
          )}
        </section>
      )}

      {/* Security management */}
      {canViewEvents && (
        <section style={sectionStyle}>
          <h2>Security Management</h2>

          <p>Manage user accounts and course assignments.</p>

          <p>
            Review login attempts and recent security events.
          </p>

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

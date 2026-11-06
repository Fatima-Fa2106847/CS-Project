
"use client";

import { useState } from "react";

export default function AdminDashboard() {
  const [users, setUsers] = useState([
    { id: "2021001", name: "Ahmed Ali", role: "Student", status: "Active" },
    { id: "2021002", name: "Sara Mohammed", role: "Student", status: "Active" },
    { id: "INS001", name: "Dr. Khalid", role: "Instructor", status: "Active" },
    { id: "2021003", name: "Omar Hassan", role: "Student", status: "Pending" },
  ]);

  const [message, setMessage] = useState("");

  function approveUser(id: string) {
    setUsers((previous) =>
      previous.map((user) =>
        user.id === id ? { ...user, status: "Active" } : user
      )
    );
    setMessage("Demo: User approval updated.");
  }

  return (
    <main style={{
      maxWidth: "1000px",
      margin: "40px auto",
      padding: "32px",
      fontFamily: "Arial, sans-serif",
    }}>
      <h1>Administrator Dashboard</h1>
      <p>Manage university portal accounts and permissions.</p>

      <section style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
        marginTop: "30px",
      }}>
        <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "10px" }}>
          <h3>Total Users</h3>
          <h2>{users.length}</h2>
        </div>

        <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "10px" }}>
          <h3>Students</h3>
          <h2>{users.filter((u) => u.role === "Student").length}</h2>
        </div>

        <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "10px" }}>
          <h3>Instructors</h3>
          <h2>{users.filter((u) => u.role === "Instructor").length}</h2>
        </div>

        <div style={{ padding: "20px", border: "1px solid #ddd", borderRadius: "10px" }}>
          <h3>Pending Approvals</h3>
          <h2>{users.filter((u) => u.status === "Pending").length}</h2>
        </div>
      </section>

      <section style={{
        marginTop: "35px",
        padding: "24px",
        border: "1px solid #ddd",
        borderRadius: "12px",
      }}>
        <h2>User Management</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "12px" }}>University ID</th>
                <th style={{ textAlign: "left", padding: "12px" }}>Name</th>
                <th style={{ textAlign: "left", padding: "12px" }}>Role</th>
                <th style={{ textAlign: "left", padding: "12px" }}>Status</th>
                <th style={{ textAlign: "left", padding: "12px" }}>Action</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ padding: "12px", borderTop: "1px solid #ddd" }}>
                    {user.id}
                  </td>
                  <td style={{ padding: "12px", borderTop: "1px solid #ddd" }}>
                    {user.name}
                  </td>
                  <td style={{ padding: "12px", borderTop: "1px solid #ddd" }}>
                    {user.role}
                  </td>
                  <td style={{ padding: "12px", borderTop: "1px solid #ddd" }}>
                    {user.status}
                  </td>
                  <td style={{ padding: "12px", borderTop: "1px solid #ddd" }}>
                    {user.status === "Pending" ? (
                      <button onClick={() => approveUser(user.id)}>
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

        {message && <p>{message}</p>}
      </section>

      <section style={{
        marginTop: "25px",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "12px",
      }}>
        <h2>Security Management</h2>
        <p>Manage user accounts, roles, and course assignments.</p>
        <p>Review recent security events.</p>
        <p><strong>Grade values are not accessible to administrators.</strong></p>
      </section>
    </main>
  );
}

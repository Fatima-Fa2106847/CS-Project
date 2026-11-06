
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createSession } from "../../lib/sessions";

import {
  isAccountLocked,
  recordFailedLogin,
  resetLoginAttempts,
} from "../../lib/login-security";
import { recordAuditEvent } from "../../lib/audit-log";

export default function AdminLogin() {
  const router = useRouter();

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const id = adminId.trim();

    // Check whether the admin account is locked
    if (isAccountLocked(id)) {
      setMessage(
        "Account temporarily locked. Please try again after 1 minute."
      );
      return;
    }

    // Validate administrator credentials
    if (id === "ADMIN001" && password === "admin123") {
  resetLoginAttempts(id);

  recordAuditEvent({
    userId: id,
    userRole: "admin",
    action: "LOGIN",
    details: "Administrator successfully logged in.",
    status: "SUCCESS",
  });

  createSession("ADMIN001", "admin");

  setMessage("");
  router.push("/admin-dashboard");
  return;
}

    // Record failed login attempt
    const remainingAttempts = recordFailedLogin(id);
    recordAuditEvent({
  userId: id,
  userRole: "admin",
  action: "LOGIN",
  details: "Failed administrator login attempt.",
  status: "DENIED",
});

    if (remainingAttempts <= 0) {

      recordAuditEvent({
  userId: id,
  userRole: "admin",
  action: "ACCOUNT_LOCKED",
  details: "Administrator account locked after five failed login attempts.",
  status: "DENIED",
});
      setMessage(
        "Too many failed attempts. Your account is locked for 1 minute."
      );
    } else {
      setMessage(
        `Invalid administrator ID or password. ${remainingAttempts} attempts remaining.`
      );
    }
  }

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "400px",
        margin: "auto",
      }}
    >
      <h1>Administrator Login</h1>

      <p>University Grade Portal</p>

      <form onSubmit={handleLogin}>
        <label>Administrator ID</label>

        <input
          value={adminId}
          onChange={(e) => setAdminId(e.target.value)}
          placeholder="Enter administrator ID"
          required
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            margin: "10px 0",
            boxSizing: "border-box",
          }}
        />

        <label>Password</label>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            margin: "10px 0",
            boxSizing: "border-box",
          }}
        />

        <button type="submit">
          Login
        </button>
      </form>

      {message && (
        <p style={{ color: "red", marginTop: "15px" }}>
          {message}
        </p>
      )}
    </main>
  );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  createSession,
  getSession,
} from "../../lib/sessions";

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

    const id = adminId.trim().toUpperCase();

    // Check whether the account is locked
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

      // Create administrator session
      createSession(id, "admin");

      // Verify that the session was stored
      const session = getSession();

      if (!session || session.role !== "admin") {
        setMessage("Unable to create a secure session. Please try again.");
        return;
      }

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
        details:
          "Administrator account locked after five failed login attempts.",
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
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Administrator Login</h1>

      <p>University Grade Portal</p>

      <form onSubmit={handleLogin}>
        <label htmlFor="adminId">Administrator ID</label>

        <input
          id="adminId"
          value={adminId}
          onChange={(e) => setAdminId(e.target.value)}
          placeholder="Enter administrator ID"
          autoComplete="username"
          required
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            margin: "10px 0",
            boxSizing: "border-box",
          }}
        />

        <label htmlFor="password">Password</label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          autoComplete="current-password"
          required
          style={{
            display: "block",
            width: "100%",
            padding: "10px",
            margin: "10px 0",
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "10px 20px",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>

      {message && (
        <p
          role="alert"
          style={{
            color: "red",
            marginTop: "15px",
          }}
        >
          {message}
        </p>
      )}
    </main>
  );
}

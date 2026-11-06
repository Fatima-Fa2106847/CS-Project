
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

    // Check account lock status
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

      // Verify session creation
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
    <main className="auth-page">
      <div className="auth-card">

        {/* UniPortal branding */}
        <Link href="/" className="auth-brand">
          <span className="auth-brand-icon">U</span>
          <span>UniPortal</span>
        </Link>

        <div className="auth-divider" />

        {/* Login heading */}
        <div className="auth-heading">
          <div className="auth-icon">🛡️</div>

          <h1>Administrator Login</h1>

          <p>
            Secure access to university account management
            and portal administration.
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="auth-form">

          <div className="auth-field">
            <label htmlFor="adminId">
              Administrator ID
            </label>

            <input
              id="adminId"
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="Enter administrator ID"
              autoComplete="username"
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </div>

          {message && (
            <p className="auth-error" role="alert">
              {message}
            </p>
          )}

          <button
            type="submit"
            className="auth-submit-button"
          >
            Login →
          </button>
        </form>

        <p className="auth-security-note">
          🔒 Authorized administrator access only.
        </p>

        <Link href="/" className="auth-back-link">
          ← Return to Homepage
        </Link>

      </div>
    </main>
  );
}


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { recordAuditEvent } from "../../lib/audit-log";

import {
  isAccountLocked,
  recordFailedLogin,
  resetLoginAttempts,
} from "../../lib/login-security";

export default function LoginPage() {
  const router = useRouter();

  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const id = universityId.trim();

    setMessage("");

    // Check whether the account is locked
    if (isAccountLocked(id)) {
      setMessage(
        "Your account is temporarily locked. Please try again after 1 minute."
      );
      return;
    }

    setIsSubmitting(true);

    // Validate demonstration credentials
    if (id === "2021001" && password === "student123") {
      resetLoginAttempts(id);

      recordAuditEvent({
        userId: id,
        userRole: "student",
        action: "LOGIN",
        details: "Student successfully logged in.",
        status: "SUCCESS",
      });

      router.push("/verify");
      return;
    }

    // Record unsuccessful login
    const remainingAttempts = recordFailedLogin(id);

    recordAuditEvent({
      userId: id || "UNKNOWN",
      userRole: "student",
      action: "LOGIN",
      details: "Failed student login attempt.",
      status: "DENIED",
    });

    setIsSubmitting(false);

    if (remainingAttempts <= 0) {
      recordAuditEvent({
        userId: id || "UNKNOWN",
        userRole: "student",
        action: "ACCOUNT_LOCKED",
        details: "Account locked after five failed login attempts.",
        status: "DENIED",
      });

      setMessage(
        "Too many failed attempts. Your account is locked for 1 minute."
      );
    } else {
      setMessage(
        `Incorrect University ID or password. ${remainingAttempts} attempts remaining.`
      );
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">

        {/* Branding */}
        <Link href="/" className="auth-brand">
          <span className="auth-brand-icon">U</span>
          <span>UniPortal</span>
        </Link>

        <div className="auth-divider" />

        {/* Login heading */}
        <div className="auth-heading">
          <div className="auth-icon">🎓</div>

          <h1>Student Login</h1>

          <p>
            Welcome back! Sign in to access your academic information.
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="auth-form">

          <div className="auth-field">
            <label htmlFor="universityId">
              University ID
            </label>

            <input
              id="universityId"
              type="text"
              placeholder="Enter your University ID"
              value={universityId}
              onChange={(event) => setUniversityId(event.target.value)}
              autoComplete="username"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={isSubmitting}
            />
          </div>

          {message && (
            <div className="auth-error" role="alert">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Signing in..."
              : "Continue to Face Verification →"}
          </button>
        </form>

        <p className="auth-security-note">
          🔒 Secure university portal access
        </p>

        <Link href="/" className="auth-back-link">
          ← Back to Home
        </Link>

      </div>
    </main>
  );
}

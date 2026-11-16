
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { recordAuditEvent } from "../../lib/audit-log";
import { getDashboardPath, isSessionRole } from "../../lib/sessions";

export default function LoginPage() {
  const router = useRouter();

  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const id = universityId.trim();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, password }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const errorMessage =
          typeof result === "object" &&
          result !== null &&
          "message" in result &&
          typeof result.message === "string"
            ? result.message
            : "Unable to sign in.";
        setMessage(errorMessage);
        return;
      }

      if (
        typeof result !== "object" ||
        result === null ||
        !("user" in result) ||
        typeof result.user !== "object" ||
        result.user === null ||
        !("id" in result.user) ||
        typeof result.user.id !== "string" ||
        !("role" in result.user) ||
        !isSessionRole(result.user.role)
      ) {
        throw new Error("The login service returned an invalid response.");
      }

      const { id: authenticatedId, role } = result.user;

      try {
        recordAuditEvent({
          userId: authenticatedId,
          userRole: role,
          action: "LOGIN",
          details: `${role} successfully logged in.`,
          status: "SUCCESS",
        });
      } catch (error) {
        console.error("Unable to record login audit event:", error);
      }

      if (role === "student") {
        router.replace("/verify");
      } else if (role === "instructor") {
        router.replace("/verify-instructor");
      } else {
        router.replace(getDashboardPath(role));
      }
    } catch (error) {
      console.error("Unable to complete login:", error);
      setMessage("Unable to reach the login service. Please try again.");
    } finally {
      setIsSubmitting(false);
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

          <h1>University Login</h1>

          <p>
            Sign in with your university ID. Your account role determines
            which portal you can access.
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
              : "Log In →"}
          </button>
        </form>

        <p className="auth-security-note">
          🔒 Secure university portal access
        </p>

        <Link href="/" className="auth-back-link">
          ← Back to Home
        </Link>

        <Link href="/register" className="auth-back-link">
          Create a student account
        </Link>

      </div>
    </main>
  );
}

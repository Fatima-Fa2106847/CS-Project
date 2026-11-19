
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

    setMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userId: universityId.trim(),
          password,
        }),
      });

      // Read response as text first to avoid JSON parsing crashes.
      const responseText = await response.text();

      if (!responseText.trim()) {
        throw new Error(
          `The login server returned an empty response (HTTP ${response.status}).`
        );
      }

      let result: any;

      try {
        result = JSON.parse(responseText);
      } catch {
        console.error("Invalid server response:", responseText);

        throw new Error(
          "The server returned an invalid response. Check the terminal for errors."
        );
      }

      if (!response.ok) {
        setMessage(
          typeof result.message === "string"
            ? result.message
            : `Login failed (HTTP ${response.status}).`
        );
        return;
      }

      if (
        !result.user ||
        typeof result.user.id !== "string" ||
        !isSessionRole(result.user.role)
      ) {
        throw new Error("Invalid login information returned by the server.");
      }

      const { id, role } = result.user;

      try {
        recordAuditEvent({
          userId: id,
          userRole: role,
          action: "LOGIN",
          details: `${role} successfully logged in.`,
          status: "SUCCESS",
        });
      } catch (error) {
        console.error("Audit logging failed:", error);
      }

      // All three roles must complete face verification.
      router.replace("/verify");
      
    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to connect to the login server."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">

        <Link href="/" className="auth-brand">
          <span className="auth-brand-icon">U</span>
          <span>UniPortal</span>
        </Link>

        <div className="auth-divider" />

        <div className="auth-heading">
          <div className="auth-icon">🎓</div>

          <h1>University Login</h1>

          <p>
            Sign in using your university ID and password.
            All users must complete face verification.
          </p>
        </div>

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
              onChange={(event) =>
                setUniversityId(event.target.value)
              }
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
              onChange={(event) =>
                setPassword(event.target.value)
              }
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
            {isSubmitting ? "Signing in..." : "Log In →"}
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

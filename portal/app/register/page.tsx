"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [universityId, setUniversityId] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setMessage("");
    setIsSuccess(false);

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: universityId, name, password }),
      });
      const result: unknown = await response.json();

      const responseMessage =
        typeof result === "object" &&
        result !== null &&
        "message" in result &&
        typeof result.message === "string"
          ? result.message
          : "Unable to submit your registration.";

      if (!response.ok) {
        setMessage(responseMessage);
        return;
      }

      setMessage(responseMessage);
      setIsSuccess(true);
      setUniversityId("");
      setName("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Unable to submit registration:", error);
      setMessage("Unable to reach the registration service. Please try again.");
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
          <div className="auth-icon">📝</div>
          <h1>Create Student Account</h1>
          <p>
            Submit your details for administrator approval. You can log in
            after your account is approved.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="universityId">University ID</label>
            <input
              id="universityId"
              type="text"
              value={universityId}
              onChange={(event) => setUniversityId(event.target.value)}
              autoComplete="username"
              maxLength={64}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              maxLength={100}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="auth-field">
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              minLength={8}
              maxLength={128}
              required
              disabled={isSubmitting}
            />
          </div>

          {message && (
            <div
              className={isSuccess ? "auth-success" : "auth-error"}
              role={isSuccess ? "status" : "alert"}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit for Approval →"}
          </button>
        </form>

        <Link href="/login" className="auth-back-link">
          ← Back to Login
        </Link>
      </div>
    </main>
  );
}

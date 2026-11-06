
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSession } from "../../lib/sessions";

export default function VerifyPage() {
  const router = useRouter();

  function handleVerification() {
    // Demonstration: simulate successful student verification
    createSession("2021001", "student");
    router.push("/student-dashboard");
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

        {/* Verification heading */}
        <div className="auth-heading">
          <div className="auth-icon">🔐</div>

          <h1>Face Verification</h1>

          <p>
            One final step! Verify your identity to securely
            access your academic information.
          </p>
        </div>

        {/* Camera preview placeholder */}
        <div className="face-preview">
          <div className="face-preview-icon">👤</div>

          <h3>Face Recognition</h3>

          <p>
            Camera preview will appear here.
          </p>

          <p>
            Make sure your face is clearly visible.
          </p>

          <span className="face-status">
            Verification ready
          </span>
        </div>

        {/* Verification button */}
        <button
          type="button"
          className="auth-submit-button"
          onClick={handleVerification}
        >
          Simulate Face Verification →
        </button>

        <p className="auth-security-note">
          🔒 Your academic information is protected.
        </p>

        <Link href="/login" className="auth-back-link">
          ← Back to Student Login
        </Link>

      </div>
    </main>
  );
}

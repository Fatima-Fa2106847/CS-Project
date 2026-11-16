
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  completeVerification,
  getDashboardPath,
  getPendingSession,
} from "../../lib/sessions";

export default function VerifyPage() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void getPendingSession()
      .then((session) => {
        if (!session) {
          router.replace("/login");
        } else if (session.role !== "student") {
          router.replace(getDashboardPath(session.role));
        } else {
          setIsCheckingSession(false);
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to verify student account:", error);
        router.replace("/login");
      });
  }, [router]);

  async function handleVerification() {
    setIsVerifying(true);
    setMessage("");

    try {
      await completeVerification("student");
      router.push("/student-dashboard");
    } catch (error) {
      console.error("Unable to complete student verification:", error);
      setMessage("Unable to complete verification. Please try again.");
      setIsVerifying(false);
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
          disabled={isCheckingSession || isVerifying}
        >
          {isCheckingSession
            ? "Checking account..."
            : isVerifying
              ? "Verifying..."
              : "Continue to Student Dashboard →"}
        </button>

        {message && (
          <div className="auth-error" role="alert">
            {message}
          </div>
        )}

        <p className="auth-security-note">
          🔒 Your academic information is protected.
        </p>

        <Link href="/login" className="auth-back-link">
          ← Back to Login
        </Link>

      </div>
    </main>
  );
}

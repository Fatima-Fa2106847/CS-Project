
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  completeVerification,
  getDashboardPath,
  getPendingSession,
} from "../../lib/sessions";

export default function VerifyInstructorPage() {
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void getPendingSession()
      .then((session) => {
        if (!session) {
          router.replace("/login");
        } else if (session.role !== "instructor") {
          router.replace(getDashboardPath(session.role));
        } else {
          setIsCheckingSession(false);
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to verify instructor account:", error);
        router.replace("/login");
      });
  }, [router]);

  async function handleVerification() {
    setIsVerifying(true);
    setMessage("");

    try {
      await completeVerification("instructor");
      router.push("/instructor-dashboard");
    } catch (error) {
      console.error("Unable to complete instructor verification:", error);
      setMessage("Unable to complete verification. Please try again.");
      setIsVerifying(false);
    }
  }

  return (
    <main style={{
      maxWidth: "480px",
      margin: "60px auto",
      padding: "32px",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
      border: "1px solid #ddd",
      borderRadius: "12px",
    }}>
      <h1>Instructor Face Verification</h1>
      <p>Verify your identity to access your assigned courses.</p>

      <div style={{
        margin: "30px auto",
        padding: "40px 20px",
        border: "2px dashed #9ca3af",
        borderRadius: "12px",
      }}>
        <p>Camera preview will appear here.</p>
        <p>Make sure your face is clearly visible.</p>
      </div>

      <button
        onClick={handleVerification}
        disabled={isCheckingSession || isVerifying}
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor: "#1d4ed8",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {isCheckingSession
          ? "Checking account..."
          : isVerifying
            ? "Verifying..."
            : "Continue to Instructor Dashboard"}
      </button>

      {message && (
        <p role="alert" style={{ color: "#dc2626" }}>
          {message}
        </p>
      )}
    </main>
  );
}

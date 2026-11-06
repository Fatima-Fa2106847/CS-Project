
"use client";

import { useRouter } from "next/navigation";
import { createSession } from "../../lib/sessions";

export default function VerifyInstructorPage() {
  const router = useRouter();

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
        onClick={() => {
  createSession("INS001", "instructor");
  router.push("/instructor-dashboard");
}}
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
        Start Face Verification
      </button>
    </main>
  );
}

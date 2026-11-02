
"use client";

import Link from "next/link";

export default function VerifyPage() {
  return (
    <main
      style={{
        maxWidth: "480px",
        margin: "60px auto",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        border: "1px solid #ddd",
        borderRadius: "12px",
      }}
    >
      <h1>Face Verification</h1>
      <p>Verify your identity to securely access your grades.</p>

      <div
        style={{
          margin: "30px auto",
          padding: "40px 20px",
          border: "2px dashed #9ca3af",
          borderRadius: "12px",
        }}
      >
        <p>Camera preview will appear here.</p>
        <p>Make sure your face is clearly visible.</p>
      </div>

      <button
        onClick={() => alert("Face verification will be connected later.")}
        style={{
          width: "100%",
          padding: "12px",
          border: "none",
          borderRadius: "6px",
          backgroundColor: "#1d4ed8",
          color: "white",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Start Face Verification
      </button>

      <p style={{ marginTop: "20px" }}>
        <Link href="/login">Back to Login</Link>
      </p>
    </main>
  );
}

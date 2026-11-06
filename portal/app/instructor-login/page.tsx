
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordAuditEvent } from "../../lib/audit-log";

import {
  isAccountLocked,
  recordFailedLogin,
  resetLoginAttempts,
} from "../../lib/login-security";

export default function InstructorLogin() {
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  const inputStyle = {
    display: "block",
    width: "100%",
    padding: "12px",
    margin: "8px 0 20px",
    boxSizing: "border-box" as const,
    border: "1px solid #9ca3af",
    borderRadius: "6px",
  };

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const id = universityId.trim();

    // Check whether the instructor account is locked
    if (isAccountLocked(id)) {
      setMessage(
        "Account temporarily locked. Please try again after 1 minute."
      );
      return;
    }

    // Demo credential validation
    if (id === "INS001" && password === "instructor123") {
  resetLoginAttempts(id);

  recordAuditEvent({
    userId: id,
    userRole: "instructor",
    action: "LOGIN",
    details: "Instructor successfully logged in.",
    status: "SUCCESS",
  });

  setMessage("");
  router.push("/verify-instructor");
  return;
}

    // Record failed login attempt
    const remainingAttempts = recordFailedLogin(id);
    recordAuditEvent({
  userId: id,
  userRole: "instructor",
  action: "LOGIN",
  details: "Failed instructor login attempt.",
  status: "DENIED",
});

    if (remainingAttempts <= 0) {
recordAuditEvent({
  userId: id,
  userRole: "instructor",
  action: "ACCOUNT_LOCKED",
  details: "Instructor account locked after five failed login attempts.",
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
    <main
      style={{
        maxWidth: "420px",
        margin: "60px auto",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
        border: "1px solid #ddd",
        borderRadius: "12px",
      }}
    >
      <h1>Instructor Login</h1>

      <p>Sign in to manage your assigned courses.</p>

      <form onSubmit={handleLogin}>
        <label htmlFor="universityId">University ID</label>

        <input
          id="universityId"
          value={universityId}
          onChange={(event) => setUniversityId(event.target.value)}
          required
          style={inputStyle}
        />

        <label htmlFor="password">Password</label>

        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          style={inputStyle}
        />

        <button
          type="submit"
          style={{
            padding: "12px",
            width: "100%",
            cursor: "pointer",
          }}
        >
          Continue to Face Verification
        </button>
      </form>

      {message && (
        <p
          style={{
            marginTop: "18px",
            color: "#dc2626",
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}
    </main>
  );
}

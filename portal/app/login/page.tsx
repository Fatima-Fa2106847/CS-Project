
"use client";

import { useState } from "react";

export default function LoginPage() {
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main style={{
      maxWidth: "420px",
      margin: "80px auto",
      padding: "32px",
      fontFamily: "Arial, sans-serif",
      border: "1px solid #ddd",
      borderRadius: "12px"
    }}>
      <h1>Student Login</h1>
      <p>Sign in to access your academic information.</p>

      <form onSubmit={(event) => {
        event.preventDefault();
        alert("Login will be connected to authentication later.");
      }}>
        <label>University ID</label>
        <input
          value={universityId}
          onChange={(event) => setUniversityId(event.target.value)}
          required
          style={{ display: "block", width: "100%", padding: "10px", margin: "8px 0 20px" }}
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          style={{ display: "block", width: "100%", padding: "10px", margin: "8px 0 20px" }}
        />

        <button type="submit" style={{ padding: "12px 24px" }}>
          Continue to Face Verification
        </button>
      </form>
    </main>
  );
}

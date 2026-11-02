
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InstructorLogin() {
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

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

      <form
        onSubmit={(event) => {
          event.preventDefault();
          router.push("/verify-instructor");
        }}
      >
        <label htmlFor="universityId">University ID</label>
        <input
          id="universityId"
          value={universityId}
          onChange={(event) => setUniversityId(event.target.value)}
          required
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            margin: "8px 0 20px",
            boxSizing: "border-box",
            border: "1px solid #9ca3af",
            borderRadius: "6px",
          }}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          style={{
            display: "block",
            width: "100%",
            padding: "12px",
            margin: "8px 0 24px",
            boxSizing: "border-box",
            border: "1px solid #9ca3af",
            borderRadius: "6px",
          }}
        />

        <button type="submit" style={{ padding: "12px", width: "100%" }}>
          Continue to Face Verification
        </button>
      </form>
    </main>
  );
}


"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";


export default function LoginPage() {
  const [universityId, setUniversityId] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const inputStyle = {
    display: "block",
    width: "100%",
    padding: "12px",
    boxSizing: "border-box" as const,
    border: "1px solid #9ca3af",
    borderRadius: "6px",
    backgroundColor: "#ffffff",
    color: "#111827",
    fontSize: "16px",
  };

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
      <h1>Student Login</h1>
      <p>Sign in to access your academic information.</p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          router.push("/verify");
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <label
            htmlFor="universityId"
            style={{ display: "block", marginBottom: "8px" }}
          >
            University ID
          </label>
          <input
            id="universityId"
            type="text"
            value={universityId}
            onChange={(event) => setUniversityId(event.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label
            htmlFor="password"
            style={{ display: "block", marginBottom: "8px" }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          style={{
            width: "100%",
            padding: "12px",
            border: "none",
            borderRadius: "6px",
            backgroundColor: "#1d4ed8",
            color: "#ffffff",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Continue to Face Verification
        </button>
      </form>
    </main>
  );
}

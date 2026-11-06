
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSession } from "../../lib/sessions";

export default function AdminLogin() {
  const router = useRouter();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleLogin() {
    if (adminId === "ADMIN001" && password === "admin123") {
      createSession("ADMIN001", "admin");
      router.push("/admin-dashboard");
    } else {
      setMessage("Invalid administrator ID or password.");
    }
  }

  return (
    <main style={{ padding: "40px", maxWidth: "400px", margin: "auto" }}>
      <h1>Administrator Login</h1>
      <p>University Grade Portal</p>

      <label>Administrator ID</label>
      <input
        value={adminId}
        onChange={(e) => setAdminId(e.target.value)}
        placeholder="Enter administrator ID"
        style={{ display: "block", width: "100%", padding: "10px", margin: "10px 0" }}
      />

      <label>Password</label>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Enter password"
        style={{ display: "block", width: "100%", padding: "10px", margin: "10px 0" }}
      />

      <button onClick={handleLogin}>
        Login
      </button>

      {message && <p style={{ color: "red" }}>{message}</p>}
    </main>
  );
}

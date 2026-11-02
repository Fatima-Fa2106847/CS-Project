
import Link from "next/link";


export default function Home() {
  return (
    <main style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
      <h1>University Grade Portal</h1>
      <p>Secure access to your academic information.</p>

      <div style={{ marginTop: "30px" }}>
        <Link href="/login" style={{ marginRight: "12px" }}>
          <button style={{ padding: "12px 24px" }}>
            Student Login
          </button>
        </Link>

        <Link href="/instructor-login">
  <button style={{ padding: "12px 24px" }}>
    Instructor Login
  </button>
</Link>
      </div>
    </main>
  );
}

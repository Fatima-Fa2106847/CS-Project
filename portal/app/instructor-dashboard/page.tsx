
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "../../lib/sessions";

export default function InstructorDashboard() {
  const router = useRouter();

  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check instructor session and role
  useEffect(() => {
    const session = getSession();

    if (!session || session.role !== "instructor") {
      router.replace("/instructor-login");
      return;
    }

    setIsCheckingSession(false);
  }, [router]);

  // Logout function
  function handleLogout() {
    clearSession();
    router.replace("/");
  }

  // Check access before displaying dashboard
  if (isCheckingSession) {
    return <p>Checking access...</p>;
  }

  // Assigned courses
  const courses = [
    {
      code: "CS380",
      name: "Cybersecurity Fundamentals",
      students: 32,
    },
    {
      code: "CS301",
      name: "Operating Systems",
      students: 28,
    },
  ];

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Instructor Dashboard</h1>

      <p>Manage your assigned courses and gradebooks.</p>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        style={{
          padding: "10px 18px",
          backgroundColor: "#dc2626",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginTop: "10px",
        }}
      >
        Logout
      </button>

      {/* Instructor courses */}
      <section
        style={{
          marginTop: "30px",
          padding: "24px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h2>My Courses</h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "12px" }}>
                Course
              </th>

              <th style={{ textAlign: "left", padding: "12px" }}>
                Name
              </th>

              <th style={{ textAlign: "left", padding: "12px" }}>
                Students
              </th>
            </tr>
          </thead>

          <tbody>
            {courses.map((course) => (
              <tr key={course.code}>
                <td
                  style={{
                    padding: "12px",
                    borderTop: "1px solid #ddd",
                  }}
                >
                  {course.code}
                </td>

                <td
                  style={{
                    padding: "12px",
                    borderTop: "1px solid #ddd",
                  }}
                >
                  {course.name}
                </td>

                <td
                  style={{
                    padding: "12px",
                    borderTop: "1px solid #ddd",
                  }}
                >
                  {course.students}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Gradebook link */}
      <div style={{ marginTop: "25px" }}>
        <Link href="/instructor-dashboard/gradebook">
          <button style={{ padding: "12px 24px" }}>
            View Gradebook
          </button>
        </Link>
      </div>
    </main>
  );
}

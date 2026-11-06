
"use client";

import Link from "next/link";
import { canViewGrade } from "../../lib/access-control";
import { demoUsers } from "../../lib/demo-users";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, clearSession } from "../../lib/sessions";

export default function StudentDashboard() {
  const router = useRouter();

  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check student session and role
  useEffect(() => {
    const session = getSession();

    if (!session || session.role !== "student") {
      router.replace("/login");
      return;
    }

    setIsCheckingSession(false);
  }, [router]);

  // Logout function
  function handleLogout() {
    clearSession();
    router.replace("/");
  }

  // Show loading message while checking access
  if (isCheckingSession) {
    return <p>Checking access...</p>;
  }

  // Demo course information
  const courses = [
    {
      studentId: "2021001",
      code: "CS380",
      name: "Cybersecurity Fundamentals",
      grade: "A-",
    },
    {
      studentId: "2021001",
      code: "CS301",
      name: "Operating Systems",
      grade: "B+",
    },
    {
      studentId: "2021001",
      code: "MATH231",
      name: "Linear Algebra",
      grade: "A",
    },
  ];

  // Identify the demo student
  const currentStudent = demoUsers.find(
    (user) => user.id === "2021001"
  );

  // Filter courses according to student permissions
  const visibleCourses = currentStudent
    ? courses.filter((course) =>
        canViewGrade(currentStudent, {
          studentId: course.studentId,
          courseId: course.code,
          assignmentGrade: 0,
          examGrade: 0,
        })
      )
    : [];

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "32px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Student Dashboard</h1>

      <p>Welcome! Here are your published grades.</p>

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

      {/* Student courses and grades */}
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
                Grade
              </th>
            </tr>
          </thead>

          <tbody>
            {visibleCourses.map((course) => (
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
                  {course.grade}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p style={{ marginTop: "24px" }}>
        <Link href="/">Return to Homepage</Link>
      </p>
    </main>
  );
}

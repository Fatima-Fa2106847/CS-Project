
"use client";

import { useState } from "react";
import Link from "next/link";

export default function GradebookPage() {
  const [students, setStudents] = useState([
    { id: "2021001", name: "Ahmed Ali", assignment: 18, exam: 42 },
    { id: "2021002", name: "Sara Mohammed", assignment: 20, exam: 45 },
    { id: "2021003", name: "Omar Hassan", assignment: 16, exam: 38 },
    { id: "2021004", name: "Mariam Khalid", assignment: 19, exam: 44 },
  ]);

  const [message, setMessage] = useState("");

  function updateGrade(
    id: string,
    field: "assignment" | "exam",
    value: number
  ) {
    setStudents((previous) =>
      previous.map((student) =>
        student.id === id
          ? { ...student, [field]: value }
          : student
      )
    );
    setMessage("");
  }

  function saveGrades() {
    setMessage("Demo: Grade changes are displayed but not saved to a database.");
  }

  return (
    <main style={{
      maxWidth: "1000px",
      margin: "40px auto",
      padding: "32px",
      fontFamily: "Arial, sans-serif",
    }}>
      <Link href="/instructor-dashboard">← Back to Dashboard</Link>

      <h1 style={{ marginTop: "25px" }}>Course Gradebook</h1>
      <p>CS380 – Cybersecurity Fundamentals</p>

      <section style={{
        marginTop: "25px",
        padding: "20px",
        border: "1px solid #ddd",
        borderRadius: "12px",
      }}>
        <h2>Student Grades</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}>
            <thead>
              <tr>
                <th style={{ padding: "12px" }}>Student ID</th>
                <th style={{ padding: "12px" }}>Student Name</th>
                <th style={{ padding: "12px" }}>Assignment / 20</th>
                <th style={{ padding: "12px" }}>Exam / 50</th>
                <th style={{ padding: "12px" }}>Total / 70</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td style={{ padding: "12px", borderTop: "1px solid #ddd" }}>
                    {student.id}
                  </td>

                  <td style={{ padding: "12px", borderTop: "1px solid #ddd" }}>
                    {student.name}
                  </td>

                  <td style={{ padding: "12px", borderTop: "1px solid #ddd" }}>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={student.assignment}
                      onChange={(e) =>
                        updateGrade(student.id, "assignment", Number(e.target.value))
                      }
                      style={{ width: "65px", padding: "7px" }}
                    />
                  </td>

                  <td style={{ padding: "12px", borderTop: "1px solid #ddd" }}>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={student.exam}
                      onChange={(e) =>
                        updateGrade(student.id, "exam", Number(e.target.value))
                      }
                      style={{ width: "65px", padding: "7px" }}
                    />
                  </td>

                  <td style={{ padding: "12px", borderTop: "1px solid #ddd" }}>
                    {student.assignment + student.exam} / 70
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={saveGrades}
          style={{
            marginTop: "25px",
            padding: "12px 24px",
            backgroundColor: "#1d4ed8",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Save Changes
        </button>

        {message && (
          <p style={{ marginTop: "15px", color: "#15803d" }}>
            {message}
          </p>
        )}
      </section>
    </main>
  );
}

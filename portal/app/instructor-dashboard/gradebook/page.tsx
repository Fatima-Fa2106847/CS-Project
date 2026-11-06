
"use client";

import { useState } from "react";
import Link from "next/link";
import { canEditGrade } from "../../../lib/access-control";
import { demoUsers } from "../../../lib/demo-users";
import { recordAuditEvent } from "../../../lib/audit-log";

export default function GradebookPage() {
  const demoInstructor = demoUsers.find(
  (user) => user.role === "instructor"
);

const canEdit = demoInstructor
  ? canEditGrade(demoInstructor, "CS380")
  : false;
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
  const student = students.find((s) => s.id === id);

  if (!canEdit) {
    recordAuditEvent({
      userId: demoInstructor?.id ?? "UNKNOWN",
      userRole: "instructor",
      action: "EDIT_GRADE",
      details: `Unauthorized attempt to edit ${field} grade for student ${id}`,
      status: "DENIED",
    });

    setMessage("Access denied: You cannot edit this course.");
    return;
  }

  if (!student) {
    setMessage("Student not found.");
    return;
  }

  const oldValue = student[field];

  const newAssignment =
    field === "assignment" ? value : student.assignment;

  const newExam =
    field === "exam" ? value : student.exam;

  if (
    !Number.isFinite(value) ||
    (field === "assignment" && (value < 0 || value > 20)) ||
    (field === "exam" && (value < 0 || value > 50))
  ) {
    setMessage("Invalid grade. Please enter a valid grade.");
    return;
  }

  setStudents((previous) =>
    previous.map((s) =>
      s.id === id ? { ...s, [field]: value } : s
    )
  );

  recordAuditEvent({
    userId: demoInstructor?.id ?? "UNKNOWN",
    userRole: "instructor",
    action: "EDIT_GRADE",
    details: `Changed ${field} grade for student ${id} in CS380 from ${oldValue} to ${value}`,
    status: "SUCCESS",
  });

  setMessage("Grade updated successfully in the demo.");
}


  function saveGrades() 
     {
  if (!canEdit) {
    setMessage("Access denied: You cannot edit this course.");
    return;
  }

  setMessage(
    "Demo: Grade changes are displayed but not yet saved to a database."
  );
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
                      disabled={!canEdit}
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
                      disabled={!canEdit}
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
          disabled={!canEdit}
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

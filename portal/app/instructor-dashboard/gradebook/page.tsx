
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { canEditGrade } from "../../../lib/access-control";
import { recordAuditEvent } from "../../../lib/audit-log";
import {
  getDashboardPath,
  getSession,
  type PortalSession,
} from "../../../lib/sessions";

type Student = {
  id: string;
  name: string;
  assignment: number;
  exam: number;
};

export default function GradebookPage() {
  const router = useRouter();

  // All React hooks must be declared before conditional returns.
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [currentInstructor, setCurrentInstructor] =
    useState<PortalSession | null>(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  const [students, setStudents] = useState<Student[]>([
    { id: "2021001", name: "Ahmed Ali", assignment: 18, exam: 42 },
    { id: "2021002", name: "Sara Mohammed", assignment: 20, exam: 45 },
    { id: "2021003", name: "Omar Hassan", assignment: 16, exam: 38 },
    { id: "2021004", name: "Mariam Khalid", assignment: 19, exam: 44 },
  ]);

  useEffect(() => {
    void getSession()
      .then((session) => {
        if (!session) {
          router.replace("/login");
        } else if (session.role !== "instructor") {
          router.replace(getDashboardPath(session.role));
        } else {
          setCurrentInstructor(session);
          setIsCheckingSession(false);
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to verify instructor session:", error);
        router.replace("/login");
      });
  }, [router]);

  const instructorId = currentInstructor?.userId ?? "";

  const canEdit = currentInstructor
    ? canEditGrade({
        id: currentInstructor.userId,
        name: currentInstructor.name,
        role: currentInstructor.role,
        enrolledCourses: currentInstructor.enrolledCourses,
        assignedCourses: currentInstructor.assignedCourses,
      }, "CS380")
    : false;

  // Update a student's grade
  function updateGrade(
    id: string,
    field: "assignment" | "exam",
    value: number
  ) {
    const student = students.find((s) => s.id === id);

    if (!canEdit || !currentInstructor) {
      recordAuditEvent({
        userId: instructorId || "UNKNOWN",
        userRole: "instructor",
        action: "EDIT_GRADE",
        details: `Unauthorized attempt to edit ${field} grade for student ${id}`,
        status: "DENIED",
      });

      setMessageType("error");
      setMessage("Access denied: You cannot edit this course.");
      return;
    }

    if (!student) {
      setMessageType("error");
      setMessage("Student not found.");
      return;
    }

    if (
      !Number.isFinite(value) ||
      (field === "assignment" && (value < 0 || value > 20)) ||
      (field === "exam" && (value < 0 || value > 50))
    ) {
      setMessageType("error");
      setMessage("Invalid grade. Please enter a valid grade.");
      return;
    }

    const oldValue = student[field];

    setStudents((previous) =>
      previous.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      )
    );

    recordAuditEvent({
      userId: currentInstructor.userId,
      userRole: "instructor",
      action: "EDIT_GRADE",
      details: `Changed ${field} grade for student ${id} in CS380 from ${oldValue} to ${value}`,
      status: "SUCCESS",
    });

    setMessageType("success");
    setMessage("Grade updated successfully in the demo.");
  }

  // Save grades (demonstration only)
  function saveGrades() {
    if (!canEdit) {
      setMessageType("error");
      setMessage("Access denied: You cannot edit this course.");
      return;
    }

    setMessageType("success");
    setMessage(
      "Demo: Grade changes are displayed but not yet saved to a database."
    );
  }

  // Show loading while checking the instructor session
  if (isCheckingSession) {
    return (
      <main className="portal-container" style={{ padding: "50px 20px" }}>
        <p>Checking instructor access...</p>
      </main>
    );
  }

  return (
    <main
      className="portal-container"
      style={{ paddingTop: "35px", paddingBottom: "50px" }}
    >
      <Link href="/instructor-dashboard">
        ← Back to Instructor Dashboard
      </Link>

      <header style={{ marginTop: "25px", marginBottom: "25px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 900 }}>
          Course Gradebook
        </h1>

        <p>
          CS380 – Cybersecurity Fundamentals
        </p>

        <p style={{ fontSize: "14px" }}>
          Instructor: {currentInstructor?.name}
        </p>
      </header>

      <section className="portal-card">
        <h2 style={{ marginBottom: "20px" }}>
          Student Grades
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Assignment / 20</th>
                <th>Exam / 50</th>
                <th>Total / 70</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>

                  <td>{student.name}</td>

                  <td>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="1"
                      value={student.assignment}
                      disabled={!canEdit}
                      onChange={(e) =>
                        updateGrade(
                          student.id,
                          "assignment",
                          Number(e.target.value)
                        )
                      }
                      style={{ width: "75px" }}
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="1"
                      value={student.exam}
                      disabled={!canEdit}
                      onChange={(e) =>
                        updateGrade(
                          student.id,
                          "exam",
                          Number(e.target.value)
                        )
                      }
                      style={{ width: "75px" }}
                    />
                  </td>

                  <td>
                    <strong>
                      {student.assignment + student.exam} / 70
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          className="portal-button"
          onClick={saveGrades}
          disabled={!canEdit}
          style={{ marginTop: "25px" }}
        >
          Save Changes
        </button>

        {message && (
          <p
            style={{
              marginTop: "18px",
              fontWeight: 700,
              color:
                messageType === "success"
                  ? "var(--success)"
                  : "var(--danger)",
            }}
          >
            {message}
          </p>
        )}
      </section>

      <p style={{ marginTop: "20px", fontSize: "13px" }}>
        Demonstration gradebook using fictional student records.
        Changes are temporary and are not saved to a database.
      </p>
    </main>
  );
}

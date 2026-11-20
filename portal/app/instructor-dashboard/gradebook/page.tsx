"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getDashboardPath,
  getSession,
  type PortalSession,
} from "../../../lib/sessions";

type Assessment = {
  id: number;
  title: string;
  type: string;
  maxGrade: number;
};

type Student = {
  id: number;
  universityId: string;
  name: string;
  grades: {
    assessmentId: number;
    grade: number | null;
  }[];
};

type Course = {
  id: number;
  code: string;
  name: string;
  assessments: Assessment[];
  students: Student[];
};

type GradeChange = {
  studentId: number;
  assessmentId: number;
  grade: number | null;
};

export default function GradebookPage() {
  const router = useRouter();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [currentInstructor, setCurrentInstructor] =
    useState<PortalSession | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(
    null
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [changes, setChanges] = useState<GradeChange[]>([]);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  // Check instructor session
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

  // Load real gradebook data
  useEffect(() => {
    if (isCheckingSession) return;

    async function loadGradebook() {
      try {
        const response = await fetch("/api/instructor/gradebook", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load gradebook.");
        }

        const data: { courses: Course[] } = await response.json();

        setCourses(data.courses);

        if (data.courses.length > 0) {
          setSelectedCourseId(data.courses[0].id);
        }
      } catch (error) {
        console.error(error);
        setMessageType("error");
        setMessage("Unable to load gradebook.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadGradebook();
  }, [isCheckingSession]);

  const selectedCourse = courses.find(
    (course) => course.id === selectedCourseId
  );

  // Read the current grade, including unsaved changes
  function getGrade(
    student: Student,
    assessmentId: number
  ): number | null {
    const changed = changes.find(
      (item) =>
        item.studentId === student.id &&
        item.assessmentId === assessmentId
    );

    if (changed) {
      return changed.grade;
    }

    return (
      student.grades.find(
        (item) => item.assessmentId === assessmentId
      )?.grade ?? null
    );
  }

  // Update a grade locally
  function updateGrade(
    studentId: number,
    assessmentId: number,
    value: string,
    maxGrade: number
  ) {
    setMessage("");

    if (value === "") {
      setChanges((previous) =>
        previous.filter(
          (item) =>
            !(
              item.studentId === studentId &&
              item.assessmentId === assessmentId
            )
        )
      );

      return;
    }

    const grade = Number(value);

    if (
      !Number.isFinite(grade) ||
      grade < 0 ||
      grade > maxGrade
    ) {
      setMessageType("error");
      setMessage(`Grade must be between 0 and ${maxGrade}.`);
      return;
    }

    setChanges((previous) => {
      const filtered = previous.filter(
        (item) =>
          !(
            item.studentId === studentId &&
            item.assessmentId === assessmentId
          )
      );

      return [
        ...filtered,
        {
          studentId,
          assessmentId,
          grade,
        },
      ];
    });
  }

  // Save all changed grades
  async function saveGrades() {
    if (isSaving || changes.length === 0) return;

    setIsSaving(true);
    setMessage("");

    try {
      for (const change of changes) {
        if (change.grade === null) continue;

        const response = await fetch("/api/instructor/gradebook", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(change),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Unable to save grade.");
        }
      }

      // Reload the latest saved grades
      const response = await fetch("/api/instructor/gradebook", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Grades saved, but unable to refresh.");
      }

      const data: { courses: Course[] } = await response.json();

      setCourses(data.courses);
      setChanges([]);

      setMessageType("success");
      setMessage("All grade changes saved successfully!");
    } catch (error) {
      console.error(error);

      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to save grades."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isCheckingSession) {
    return (
      <main
        className="portal-container"
        style={{ padding: "50px 20px" }}
      >
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
          Manage student grades for your assigned courses.
        </p>

        <p style={{ fontSize: "14px" }}>
          Instructor: {currentInstructor?.name}
        </p>
      </header>

      <section className="portal-card">
        <h2 style={{ marginBottom: "20px" }}>
          Student Grades
        </h2>

        {isLoading ? (
          <p>Loading gradebook...</p>
        ) : courses.length === 0 ? (
          <p>No courses assigned to your account.</p>
        ) : (
          <>
            {/* Course dropdown */}
            <div style={{ marginBottom: "25px" }}>
              <label
                htmlFor="course-select"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: 700,
                }}
              >
                Select Course
              </label>

              <select
                id="course-select"
                value={selectedCourseId ?? ""}
                disabled={isSaving}
                onChange={(event) => {
                  setSelectedCourseId(Number(event.target.value));
                  setMessage("");
                }}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  width: "100%",
                  maxWidth: "350px",
                }}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} – {course.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedCourse && (
              <>
                <h3 style={{ marginBottom: "15px" }}>
                  {selectedCourse.code} – {selectedCourse.name}
                </h3>

                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>

                        {selectedCourse.assessments.map((assessment) => (
                          <th key={assessment.id}>
                            {assessment.title} / {assessment.maxGrade}
                          </th>
                        ))}

                        <th>
                          Total /{" "}
                          {selectedCourse.assessments.reduce(
                            (sum, assessment) =>
                              sum + assessment.maxGrade,
                            0
                          )}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {selectedCourse.students.map((student) => {
                        const total = selectedCourse.assessments.reduce(
                          (sum, assessment) =>
                            sum +
                            (getGrade(student, assessment.id) ?? 0),
                          0
                        );

                        const maxTotal =
                          selectedCourse.assessments.reduce(
                            (sum, assessment) =>
                              sum + assessment.maxGrade,
                            0
                          );

                        return (
                          <tr key={student.id}>
                            <td>{student.universityId}</td>
                            <td>{student.name}</td>

                            {selectedCourse.assessments.map(
                              (assessment) => (
                                <td key={assessment.id}>
                                  <input
                                    type="number"
                                    min="0"
                                    max={assessment.maxGrade}
                                    step="0.5"
                                    value={
                                      getGrade(
                                        student,
                                        assessment.id
                                      ) ?? ""
                                    }
                                    disabled={isSaving}
                                    onChange={(event) =>
                                      updateGrade(
                                        student.id,
                                        assessment.id,
                                        event.target.value,
                                        assessment.maxGrade
                                      )
                                    }
                                    style={{ width: "75px" }}
                                  />
                                </td>
                              )
                            )}

                            <td>
                              <strong>
                                {total} / {maxTotal}
                              </strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {selectedCourse.students.length === 0 && (
                  <p style={{ marginTop: "15px" }}>
                    No students are enrolled in this course.
                  </p>
                )}

                <button
                  className="portal-button"
                  onClick={saveGrades}
                  disabled={isSaving || changes.length === 0}
                  style={{ marginTop: "25px" }}
                >
                  {isSaving
                    ? "Saving..."
                    : `Save Changes (${changes.length})`}
                </button>
              </>
            )}
          </>
        )}

        {message && (
          <p
            role="status"
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
        Grades are stored securely in the university database.
        Only authorized instructors can update grades for their
        assigned courses.
      </p>
    </main>
  );
}
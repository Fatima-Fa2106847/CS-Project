"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearSession,
  getDashboardPath,
  getSession,
  type PortalSession,
} from "../../lib/sessions";

type Assessment = {
  id: number;
  title: string;
  maxGrade: number;
  grade: number | null;
};

type Course = {
  id: number;
  code: string;
  name: string;
  assessments: Assessment[];
  total: number;
  maxTotal: number;
  hasGrades: boolean;
};

export default function StudentDashboard() {
  const router = useRouter();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [currentStudent, setCurrentStudent] =
    useState<PortalSession | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState("");

  // Check student session
  useEffect(() => {
    void getSession()
      .then((session) => {
        if (!session) {
          router.replace("/login");
          return;
        }

        if (session.role !== "student") {
          router.replace(getDashboardPath(session.role));
          return;
        }

        setCurrentStudent(session);
        setIsCheckingSession(false);
      })
      .catch((error: unknown) => {
        console.error("Unable to verify student session:", error);
        router.replace("/login");
      });
  }, [router]);

  // Load real courses and grades
  useEffect(() => {
    if (isCheckingSession) return;

    async function loadCourses() {
      try {
        const response = await fetch("/api/student/courses", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load student courses.");
        }

        const data: { courses: Course[] } = await response.json();

        setCourses(data.courses);
      } catch (error) {
        console.error("Student courses error:", error);
        setCoursesError("Unable to load your courses and grades.");
      } finally {
        setIsLoadingCourses(false);
      }
    }

    void loadCourses();
  }, [isCheckingSession]);

  // Logout
  async function handleLogout() {
    try {
      await clearSession();
      router.replace("/");
    } catch (error) {
      console.error("Unable to log out:", error);
    }
  }

  // Count courses containing saved grades
  const publishedGrades = courses.filter(
    (course) => course.hasGrades
  ).length;

  if (isCheckingSession || !currentStudent) {
    return (
      <main
        className="portal-container"
        style={{ padding: "50px 20px" }}
      >
        <p>Checking student access...</p>
      </main>
    );
  }

  return (
    <main className="dashboard-page">

      {/* Header */}
      <header className="dashboard-header">
        <Link href="/" className="dashboard-brand">
          <span className="dashboard-brand-icon">U</span>
          <span>UniPortal</span>
        </Link>

        <button
          className="dashboard-logout"
          onClick={handleLogout}
        >
          Logout →
        </button>
      </header>

      <div className="dashboard-container">

        {/* Welcome section */}
        <section className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">
              STUDENT PORTAL
            </p>

            <h1>Welcome, {currentStudent.name}!</h1>

            <p>
              Here is an overview of your academic information
              and recorded grades.
            </p>
          </div>

          <div className="dashboard-student-badge">
            <span>🎓</span>
            <div>
              <strong>Student ID</strong>
              <p>{currentStudent.userId}</p>
            </div>
          </div>
        </section>

        {/* Academic summary */}
        <section className="dashboard-stats">
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">📚</span>
            <div>
              <h3>
                {isLoadingCourses ? "..." : courses.length}
              </h3>
              <p>Enrolled Courses</p>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">📊</span>
            <div>
              <h3>
                {isLoadingCourses ? "..." : publishedGrades}
              </h3>
              <p>Courses With Grades</p>
            </div>
          </div>
        </section>

        {/* Courses */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>My Courses</h2>
              <p>Your academic courses and recorded grades.</p>
            </div>

            <span className="dashboard-course-count">
              {courses.length} Courses
            </span>
          </div>

          {isLoadingCourses ? (
            <p>Loading your courses...</p>
          ) : coursesError ? (
            <p role="alert">{coursesError}</p>
          ) : courses.length === 0 ? (
            <p>No courses are currently available.</p>
          ) : (
            <div className="student-course-grid">
              {courses.map((course) => (
                <article
                  className="student-course-card"
                  key={course.id}
                >
                  <div className="student-course-top">
                    <span className="student-course-code">
                      {course.code}
                    </span>

                    <span className="student-course-icon">
                      📖
                    </span>
                  </div>

                  <h3>{course.name}</h3>

                  <p>
                    {course.assessments.length} Assessments
                  </p>

                  {/* Individual assessment grades */}
                  <div style={{ marginTop: "15px" }}>
                    {course.assessments.map((assessment) => (
                      <p
                        key={assessment.id}
                        style={{ marginBottom: "8px" }}
                      >
                        <strong>{assessment.title}:</strong>{" "}
                        {assessment.grade === null
                          ? "Not graded"
                          : `${assessment.grade} / ${assessment.maxGrade}`}
                      </p>
                    ))}
                  </div>

                  {/* Total grade */}
                  <div className="student-course-grade">
                    <span>Recorded Total</span>

                    <strong>
                      {course.hasGrades
                        ? `${course.total} / ${course.maxTotal}`
                        : "Not graded"}
                    </strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Security note */}
        <section className="dashboard-security">
          <span>🔒</span>
          <div>
            <strong>Your information is protected</strong>
            <p>
              You can only access your own academic information
              through your student account.
            </p>
          </div>
        </section>

        <footer className="dashboard-footer">
          UNIPORTAL · UNIVERSITY GRADE PORTAL
        </footer>

      </div>
    </main>
  );
}
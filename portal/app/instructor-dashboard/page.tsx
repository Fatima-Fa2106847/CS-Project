"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearSession,
  getDashboardPath,
  getSession,
} from "../../lib/sessions";

type Course = {
  id: number;
  code: string;
  name: string;
  students: number;
  description: string;
};

export default function InstructorDashboard() {
  const router = useRouter();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesError, setCoursesError] = useState("");

  // Check instructor session
  useEffect(() => {
    void getSession()
      .then((session) => {
        if (!session) {
          router.replace("/login");
        } else if (session.role !== "instructor") {
          router.replace(getDashboardPath(session.role));
        } else {
          setIsCheckingSession(false);
        }
      })
      .catch((error: unknown) => {
        console.error("Unable to verify instructor session:", error);
        router.replace("/login");
      });
  }, [router]);

  // Load real courses from the database
  useEffect(() => {
    if (isCheckingSession) return;

    async function loadCourses() {
      try {
        const response = await fetch("/api/instructor/courses", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Unable to load courses");
        }

        const data = await response.json();
        setCourses(data.courses);
      } catch (error) {
        console.error("Unable to load instructor courses:", error);
        setCoursesError("Unable to load your courses. Please try again.");
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

  // Loading screen
  if (isCheckingSession) {
    return (
      <main className="portal-container" style={{ padding: "50px 20px" }}>
        <p>Checking instructor access...</p>
      </main>
    );
  }

  // Calculate real student count
  const totalStudents = courses.reduce(
    (total, course) => total + course.students,
    0
  );

  return (
    <main className="instructor-dashboard-page">

      {/* Header */}
      <header className="instructor-dashboard-header">
        <Link href="/" className="instructor-dashboard-brand">
          <span className="instructor-dashboard-brand-icon">U</span>
          <span>UniPortal</span>
        </Link>

        <button
          type="button"
          className="instructor-dashboard-logout"
          onClick={handleLogout}
        >
          Logout →
        </button>
      </header>

      <div className="instructor-dashboard-container">

        {/* Welcome section */}
        <section className="instructor-dashboard-welcome">
          <div>
            <p className="instructor-dashboard-eyebrow">
              INSTRUCTOR PORTAL
            </p>

            <h1>Welcome, Instructor!</h1>

            <p>
              Manage your assigned courses, review student information,
              and access your gradebooks.
            </p>
          </div>

          <div className="instructor-dashboard-welcome-icon">
            📚
          </div>
        </section>

        {/* Summary cards */}
        <section className="instructor-dashboard-stats">
          <div className="instructor-dashboard-stat-card">
            <span className="instructor-dashboard-stat-icon">📖</span>
            <div>
              <h3>{isLoadingCourses ? "..." : courses.length}</h3>
              <p>Assigned Courses</p>
            </div>
          </div>

          <div className="instructor-dashboard-stat-card">
            <span className="instructor-dashboard-stat-icon">🎓</span>
            <div>
              <h3>{isLoadingCourses ? "..." : totalStudents}</h3>
              <p>Total Students</p>
            </div>
          </div>
        </section>

        {/* Assigned courses */}
        <section className="instructor-dashboard-section">
          <div className="instructor-dashboard-section-heading">
            <div>
              <h2>My Courses</h2>
              <p>Courses currently assigned to your account.</p>
            </div>

            <span className="instructor-dashboard-count">
              {courses.length} Courses
            </span>
          </div>

          {isLoadingCourses ? (
            <p>Loading your courses...</p>
          ) : coursesError ? (
            <p role="alert">{coursesError}</p>
          ) : courses.length === 0 ? (
            <p>No courses are currently assigned to your account.</p>
          ) : (
            <div className="instructor-dashboard-course-grid">
              {courses.map((course) => (
                <article
                  className="instructor-dashboard-course-card"
                  key={course.id}
                >
                  <div className="instructor-dashboard-course-top">
                    <span className="instructor-dashboard-course-code">
                      {course.code}
                    </span>

                    <span className="instructor-dashboard-course-icon">
                      📚
                    </span>
                  </div>

                  <h3>{course.name}</h3>

                  <p>{course.description}</p>

                  <div className="instructor-dashboard-student-count">
                    <span>👥</span>
                    <strong>{course.students} Students</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Gradebook access */}
        <section className="instructor-dashboard-gradebook">
          <div>
            <p className="instructor-dashboard-eyebrow">
              COURSE MANAGEMENT
            </p>

            <h2>Ready to manage your grades?</h2>

            <p>
              Open your gradebook to review student grades and
              make authorized updates.
            </p>
          </div>

          <Link
            href="/instructor-dashboard/gradebook"
            className="instructor-dashboard-gradebook-button"
          >
            Open Gradebook →
          </Link>
        </section>

        {/* Security note */}
        <section className="instructor-dashboard-security">
          <span>🔒</span>
          <div>
            <strong>Secure instructor access</strong>
            <p>
              Your account can access instructor features through
              an authenticated session.
            </p>
          </div>
        </section>

        <footer className="instructor-dashboard-footer">
          UNIPORTAL · UNIVERSITY GRADE PORTAL
        </footer>

      </div>
    </main>
  );
}
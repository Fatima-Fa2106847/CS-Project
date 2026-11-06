
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { canViewGrade } from "../../lib/access-control";
import { demoUsers } from "../../lib/demo-users";
import { getSession, clearSession } from "../../lib/sessions";
import { recordAuditEvent } from "../../lib/audit-log";

export default function StudentDashboard() {
  const router = useRouter();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [studentId, setStudentId] = useState("");

  // Verify student session
  useEffect(() => {
    const session = getSession();

    if (!session || session.role !== "student") {
      router.replace("/login");
      return;
    }

    const studentExists = demoUsers.some(
      (user) =>
        user.id === session.userId &&
        user.role === "student"
    );

    if (!studentExists) {
      clearSession();
      router.replace("/login");
      return;
    }

    setStudentId(session.userId);
    setIsCheckingSession(false);
  }, [router]);

  // Find authenticated student
  const currentStudent = demoUsers.find(
    (user) =>
      user.id === studentId &&
      user.role === "student"
  );

  // Logout
  function handleLogout() {
    if (currentStudent) {
      recordAuditEvent({
        userId: currentStudent.id,
        userRole: "student",
        action: "LOGOUT",
        details: "Student logged out.",
        status: "SUCCESS",
      });
    }

    clearSession();
    router.replace("/");
  }

  // Demonstration course information
  const courses = [
    {
      studentId: "2021001",
      code: "CS380",
      name: "Cybersecurity Fundamentals",
      grade: "A-",
      description: "Information security, threats and protection.",
    },
    {
      studentId: "2021001",
      code: "CS301",
      name: "Operating Systems",
      grade: "B+",
      description: "Processes, memory and operating system concepts.",
    },
    {
      studentId: "2021001",
      code: "MATH231",
      name: "Linear Algebra",
      grade: "A",
      description: "Matrices, vectors and linear transformations.",
    },
  ];

  // Show only courses the student is permitted to view
  const visibleCourses = currentStudent
    ? courses.filter((course) =>
        course.studentId === currentStudent.id &&
        canViewGrade(currentStudent, {
          studentId: course.studentId,
          courseId: course.code,
          assignmentGrade: 0,
          examGrade: 0,
        })
      )
    : [];

  if (isCheckingSession || !currentStudent) {
    return (
      <main className="portal-container" style={{ padding: "50px 20px" }}>
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
              and published grades.
            </p>
          </div>

          <div className="dashboard-student-badge">
            <span>🎓</span>
            <div>
              <strong>Student ID</strong>
              <p>{currentStudent.id}</p>
            </div>
          </div>
        </section>

        {/* Academic summary */}
        <section className="dashboard-stats">
          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">📚</span>
            <div>
              <h3>{visibleCourses.length}</h3>
              <p>Enrolled Courses</p>
            </div>
          </div>

          <div className="dashboard-stat-card">
            <span className="dashboard-stat-icon">📊</span>
            <div>
              <h3>{visibleCourses.length}</h3>
              <p>Published Grades</p>
            </div>
          </div>
        </section>

        {/* Courses */}
        <section className="dashboard-section">
          <div className="dashboard-section-heading">
            <div>
              <h2>My Courses</h2>
              <p>Your academic courses and published grades.</p>
            </div>

            <span className="dashboard-course-count">
              {visibleCourses.length} Courses
            </span>
          </div>

          <div className="student-course-grid">
            {visibleCourses.length > 0 ? (
              visibleCourses.map((course) => (
                <article
                  className="student-course-card"
                  key={course.code}
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

                  <p>{course.description}</p>

                  <div className="student-course-grade">
                    <span>Published Grade</span>
                    <strong>{course.grade}</strong>
                  </div>
                </article>
              ))
            ) : (
              <p>No published courses are currently available.</p>
            )}
          </div>
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

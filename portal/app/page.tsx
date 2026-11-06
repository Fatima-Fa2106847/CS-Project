
import Link from "next/link";

export default function Home() {
  return (
    <main className="home-page">
      <div className="home-content">

        {/* UniPortal Branding */}
        <div className="home-logo">
          <div className="home-logo-icon">U</div>
          <h1>UniPortal</h1>
        </div>

        <div className="home-divider" />

        {/* Welcome Section */}
        <h2>Welcome to Your University Portal</h2>

        <p className="home-description">
          Your academic world, securely connected.
          Access your courses, grades, and university services.
        </p>

        {/* Login Options */}
        <div className="home-login-options">

          {/* Student Login */}
          <div className="home-login-card">
            <div className="home-card-icon">🎓</div>

            <h3>Student Portal</h3>

            <p>
              Access your academic records, courses, and grades.
            </p>

            <Link href="/login" className="home-login-button">
              Student Login
              <span>→</span>
            </Link>
          </div>

          {/* Instructor Login */}
          <div className="home-login-card">
            <div className="home-card-icon">📚</div>

            <h3>Instructor Portal</h3>

            <p>
              Manage your courses and student grade records.
            </p>

            <Link
              href="/instructor-login"
              className="home-login-button"
            >
              Instructor Login
              <span>→</span>
            </Link>
          </div>

          {/* Administrator Login */}
          <div className="home-login-card">
            <div className="home-card-icon">🛡️</div>

            <h3>Administrator Portal</h3>

            <p>
              Manage user accounts, registrations, and portal security.
            </p>

            <Link
              href="/admin-login"
              className="home-login-button"
            >
              Admin Login
              <span>→</span>
            </Link>
          </div>

        </div>

        {/* Footer */}
        <p className="home-footer">
          UNIVERSITY GRADE PORTAL · SECURE ACCESS
        </p>

      </div>
    </main>
  );
}

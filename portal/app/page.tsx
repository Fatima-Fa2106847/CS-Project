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

        {/* Single role-independent login */}
        <div className="home-login-options">
          <div className="home-login-card">
            <div className="home-card-icon">🎓</div>

            <h3>University Account</h3>

            <p>
              Sign in with your university ID. Your account role determines
              which portal you can access.
            </p>

            <Link href="/login" className="home-login-button">
              Log In
              <span>→</span>
            </Link>
          </div>
        </div>

        <p className="home-description">
          New student?{" "}
          <Link href="/register">
            Create an account for admin approval
          </Link>.
        </p>

        {/* Footer */}
        <p className="home-footer">
          UNIVERSITY GRADE PORTAL · SECURE ACCESS
        </p>

      </div>
    </main>
  );
}
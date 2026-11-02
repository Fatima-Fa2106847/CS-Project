
import Link from "next/link";

export default function StudentDashboard() {
  const courses = [
    { code: "CS380", name: "Cybersecurity Fundamentals", grade: "A-" },
    { code: "CS301", name: "Operating Systems", grade: "B+" },
    { code: "MATH231", name: "Linear Algebra", grade: "A" },
  ];

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

      <section
        style={{
          marginTop: "30px",
          padding: "24px",
          border: "1px solid #ddd",
          borderRadius: "12px",
        }}
      >
        <h2>My Courses</h2>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "12px" }}>Course</th>
              <th style={{ textAlign: "left", padding: "12px" }}>Name</th>
              <th style={{ textAlign: "left", padding: "12px" }}>Grade</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.code}>
                <td style={{ padding: "12px", borderTop: "1px solid #ddd" }}>
                  {course.code}
                </td>
                <td style={{ padding: "12px", borderTop: "1px solid #ddd" }}>
                  {course.name}
                </td>
                <td style={{ padding: "12px", borderTop: "1px solid #ddd" }}>
                  {course.grade}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p style={{ marginTop: "24px" }}>
        <Link href="/">Log out</Link>
      </p>
    </main>
  );
}

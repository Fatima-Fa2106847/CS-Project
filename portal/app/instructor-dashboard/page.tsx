import Link from "next/link";
export default function InstructorDashboard() {
  const courses = [
    { code: "CS380", name: "Cybersecurity Fundamentals", students: 32 },
    { code: "CS301", name: "Operating Systems", students: 28 },
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
      <h1>Instructor Dashboard</h1>
      <p>Manage your assigned courses and gradebooks.</p>

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
              <th style={{ textAlign: "left", padding: "12px" }}>Students</th>
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
                  {course.students}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <div style={{ marginTop: "25px" }}>
  <Link href="/instructor-dashboard/gradebook">
    <button style={{ padding: "12px 24px" }}>
      View Gradebook
    </button>
  </Link>
</div>
    </main>
  );
}

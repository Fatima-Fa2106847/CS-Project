const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const argon2 = require("argon2");

// Import password security functions
const {
  validatePassword,
  isPasswordCompromised,
} = require("../lib/security/passwordPolicy.js");

// Connect to SQLite
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Existing university accounts
  const users = [
    {
      universityId: "ya1808056",
      name: "Yara",
      email: "ya1808056@uni.com",
      password: process.env.SEED_YARA_PASSWORD,
      role: "ADMIN",
    },
    {
      universityId: "fa2106847",
      name: "Fatima",
      email: "fa2106847@uni.com",
      password: process.env.SEED_FATIMA_PASSWORD,
      role: "STUDENT",
    },
    {
      universityId: "de2203628",
      name: "Dana",
      email: "da2203628@uni.com",
      password: process.env.SEED_DANA_PASSWORD,
      role: "STUDENT",
    },
    {
      universityId: "ka2313170",
      name: "Khawla",
      email: "ka2313170@uni.com",
      password: process.env.SEED_KHAWLA_PASSWORD,
      role: "INSTRUCTOR",
    },
  ];

  // Create missing accounts only
  for (const user of users) {
    const existing = await prisma.user.findUnique({
      where: { universityId: user.universityId },
    });

    if (!existing) {
      // Check that password exists
      if (!user.password) {
        throw new Error(
          `Missing seed password for ${user.name}`
        );
      }

      // Check password length and common passwords
      const result = validatePassword(user.password);

      if (!result.valid) {
        throw new Error(
          `Invalid password for ${user.name}: ${result.reason}`
        );
      }

      // Check if password appeared in a data breach
      const compromised = await isPasswordCompromised(
        user.password
      );

      if (compromised) {
        throw new Error(
          `Invalid password for ${user.name}: Password found in a data breach.`
        );
      }

      // Hash password using Argon2id
      const passwordHash = await argon2.hash(user.password, {
        type: argon2.argon2id,
      });

      await prisma.user.create({
        data: {
          universityId: user.universityId,
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role,
          status: "ACTIVE",
        },
      });
    }

    console.log(`Account ready: ${user.name}`);
  }

  // Find the instructor
  const instructor = await prisma.user.findUnique({
    where: { universityId: "ka2313170" },
  });

  if (!instructor || instructor.role !== "INSTRUCTOR") {
    throw new Error("Instructor account not found.");
  }

  // Create real courses
  const courses = [
    {
      courseCode: "CS380",
      courseName: "Cybersecurity Fundamentals",
    },
    {
      courseCode: "CS301",
      courseName: "Operating Systems",
    },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { courseCode: course.courseCode },
      update: {},
      create: {
        ...course,
        instructorId: instructor.id,
      },
    });

    console.log(`Course ready: ${course.courseCode}`);
  }

  // Enroll existing students
  const students = ["fa2106847", "de2203628"];

  for (const studentId of students) {
    const student = await prisma.user.findUnique({
      where: { universityId: studentId },
    });

    if (!student || student.role !== "STUDENT") {
      throw new Error(`Student not found: ${studentId}`);
    }

    for (const courseCode of ["CS380", "CS301"]) {
      const course = await prisma.course.findUnique({
        where: { courseCode },
      });

      if (!course || course.instructorId !== instructor.id) {
        throw new Error(
          `Course not assigned correctly: ${courseCode}`
        );
      }

      await prisma.enrollment.upsert({
        where: {
          studentId_courseId: {
            studentId: student.id,
            courseId: course.id,
          },
        },
        update: {},
        create: {
          studentId: student.id,
          courseId: course.id,
          status: "ACTIVE",
        },
      });

      console.log(
        `${student.name} enrolled in ${courseCode}`
      );
    }
  }

  // Create assessments for both courses
  const assessments = [
    {
      courseCode: "CS380",
      title: "Assignment",
      type: "ASSIGNMENT",
      maxGrade: 20,
    },
    {
      courseCode: "CS380",
      title: "Exam",
      type: "EXAM",
      maxGrade: 50,
    },
    {
      courseCode: "CS301",
      title: "Assignment",
      type: "ASSIGNMENT",
      maxGrade: 20,
    },
    {
      courseCode: "CS301",
      title: "Exam",
      type: "EXAM",
      maxGrade: 50,
    },
  ];

  for (const assessment of assessments) {
    const course = await prisma.course.findUnique({
      where: { courseCode: assessment.courseCode },
    });

    if (!course) {
      throw new Error(
        `Course not found: ${assessment.courseCode}`
      );
    }

    // Avoid duplicate assessments
    const existing = await prisma.assessment.findFirst({
      where: {
        courseId: course.id,
        title: assessment.title,
        type: assessment.type,
      },
    });

    if (!existing) {
      await prisma.assessment.create({
        data: {
          courseId: course.id,
          title: assessment.title,
          type: assessment.type,
          maxGrade: assessment.maxGrade,
        },
      });
    }

    console.log(
      `Assessment ready: ${assessment.courseCode} - ${assessment.title}`
    );
  }

  console.log("Database seeding completed!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
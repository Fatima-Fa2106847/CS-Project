import { cookies } from "next/headers";

import prisma from "../../../../lib/prisma.js";
import { getUserForSession } from "../../../../lib/auth-service";
import { AUTH_SESSION_COOKIE } from "../../../../lib/auth-constants";

// GET: Retrieve the logged-in student's courses and grades
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

    if (!token) {
      return Response.json(
        { message: "Authentication required." },
        { status: 401 }
      );
    }

    const session = await getUserForSession(token);

    if (!session) {
      return Response.json(
        { message: "Invalid or expired session." },
        { status: 401 }
      );
    }

    if (session.role !== "student") {
      return Response.json(
        { message: "Student access required." },
        { status: 403 }
      );
    }

    // Find the authenticated student
    const student = await prisma.user.findUnique({
      where: {
        universityId: session.id,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      return Response.json(
        { message: "Student not found." },
        { status: 404 }
      );
    }

    // Retrieve only this student's active enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: {
        studentId: student.id,
        status: "ACTIVE",
      },
      include: {
        course: {
          include: {
            assessments: {
              orderBy: {
                id: "asc",
              },
              include: {
                grades: {
                  where: {
                    studentId: student.id,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        course: {
          courseCode: "asc",
        },
      },
    });

    const courses = enrollments.map((enrollment) => {
      const assessments = enrollment.course.assessments.map(
        (assessment) => ({
          id: assessment.id,
          title: assessment.title,
          maxGrade: assessment.maxGrade,
          grade: assessment.grades[0]?.grade ?? null,
        })
      );

      const gradedAssessments = assessments.filter(
        (assessment) => assessment.grade !== null
      );

      const total = gradedAssessments.reduce(
        (sum, assessment) => sum + (assessment.grade ?? 0),
        0
      );

      const maxTotal = assessments.reduce(
        (sum, assessment) => sum + assessment.maxGrade,
        0
      );

      return {
        id: enrollment.course.id,
        code: enrollment.course.courseCode,
        name: enrollment.course.courseName,
        assessments,
        total,
        maxTotal,
        hasGrades: gradedAssessments.length > 0,
      };
    });

    return Response.json({
      courses,
    });
  } catch (error) {
    console.error("Student courses error:", error);

    return Response.json(
      { message: "Unable to retrieve student courses." },
      { status: 500 }
    );
  }
}
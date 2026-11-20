import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";

import prisma from "../../../../lib/prisma.js";
import { getUserForSession } from "../../../../lib/auth-service";
import { AUTH_SESSION_COOKIE } from "../../../../lib/auth-constants";

// Verify that the user is an authenticated instructor
async function getInstructor() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const session = await getUserForSession(token);

  if (!session || session.role !== "instructor") {
    return null;
  }

  return session;
}

// Prisma query configuration for gradebook courses
const gradebookCourseQuery = {
  include: {
    assessments: {
      orderBy: {
        id: "asc",
      },
      include: {
        grades: true,
      },
    },
    enrollments: {
      where: {
        status: "ACTIVE",
      },
      include: {
        student: {
          select: {
            id: true,
            universityId: true,
            name: true,
          },
        },
      },
    },
  },
} satisfies Prisma.CourseDefaultArgs;

// Infer the correct types from Prisma
type GradebookCourse = Prisma.CourseGetPayload<
  typeof gradebookCourseQuery
>;

type GradebookAssessment = GradebookCourse["assessments"][number];

type GradebookEnrollment = GradebookCourse["enrollments"][number];

type GradebookGrade = GradebookAssessment["grades"][number];

// GET: Load courses, students, assessments, and grades
export async function GET() {
  try {
    const instructor = await getInstructor();

    if (!instructor) {
      return Response.json(
        { message: "Instructor access required." },
        { status: 403 }
      );
    }

    const courses: GradebookCourse[] = await prisma.course.findMany({
      where: {
        instructor: {
          universityId: instructor.id,
        },
      },
      ...gradebookCourseQuery,
      orderBy: {
        courseCode: "asc",
      },
    });

    return Response.json({
      courses: courses.map((course: GradebookCourse) => ({
        id: course.id,
        code: course.courseCode,
        name: course.courseName,

        assessments: course.assessments.map(
          (assessment: GradebookAssessment) => ({
            id: assessment.id,
            title: assessment.title,
            type: assessment.type,
            maxGrade: assessment.maxGrade,
          })
        ),

        students: course.enrollments.map(
          (enrollment: GradebookEnrollment) => ({
            id: enrollment.student.id,
            universityId: enrollment.student.universityId,
            name: enrollment.student.name,

            grades: course.assessments.map(
              (assessment: GradebookAssessment) => {
                const grade = assessment.grades.find(
                  (grade: GradebookGrade) =>
                    grade.studentId === enrollment.student.id
                );

                return {
                  assessmentId: assessment.id,
                  grade: grade?.grade ?? null,
                };
              }
            ),
          })
        ),
      })),
    });
  } catch (error) {
    console.error("Gradebook GET error:", error);

    return Response.json(
      { message: "Unable to load gradebook." },
      { status: 500 }
    );
  }
}

// PUT: Save a student's grade
export async function PUT(request: Request) {
  try {
    const instructor = await getInstructor();

    if (!instructor) {
      return Response.json(
        { message: "Instructor access required." },
        { status: 403 }
      );
    }

    // Read the request safely
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("studentId" in body) ||
      !("assessmentId" in body) ||
      !("grade" in body)
    ) {
      return Response.json(
        { message: "Invalid grade data." },
        { status: 400 }
      );
    }

    const { studentId, assessmentId, grade } = body;

    // Validate input types
    if (
      typeof studentId !== "number" ||
      !Number.isSafeInteger(studentId) ||
      studentId <= 0 ||
      typeof assessmentId !== "number" ||
      !Number.isSafeInteger(assessmentId) ||
      assessmentId <= 0 ||
      typeof grade !== "number" ||
      !Number.isFinite(grade)
    ) {
      return Response.json(
        { message: "Invalid grade values." },
        { status: 400 }
      );
    }

    // Find the instructor's actual database record
    const instructorRecord = await prisma.user.findUnique({
      where: {
        universityId: instructor.id,
      },
      select: {
        id: true,
      },
    });

    if (!instructorRecord) {
      return Response.json(
        { message: "Instructor not found." },
        { status: 403 }
      );
    }

    // Check that the assessment belongs to this instructor
    const assessment = await prisma.assessment.findFirst({
      where: {
        id: assessmentId,
        course: {
          instructorId: instructorRecord.id,
        },
      },
      include: {
        course: true,
      },
    });

    if (!assessment) {
      return Response.json(
        { message: "Assessment not found or access denied." },
        { status: 403 }
      );
    }

    // Validate grade range
    if (grade < 0 || grade > assessment.maxGrade) {
      return Response.json(
        {
          message: `Grade must be between 0 and ${assessment.maxGrade}.`,
        },
        { status: 400 }
      );
    }

    // Check that the student is actively enrolled
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId: assessment.courseId,
        status: "ACTIVE",
        student: {
          role: "STUDENT",
          status: "ACTIVE",
        },
      },
    });

    if (!enrollment) {
      return Response.json(
        { message: "Student is not actively enrolled." },
        { status: 403 }
      );
    }

    // Save the grade and audit log together
    const savedGrade = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Recheck authorization inside the transaction
        const authorizedAssessment = await tx.assessment.findFirst({
          where: {
            id: assessmentId,
            course: {
              instructorId: instructorRecord.id,
            },
          },
        });

        const activeEnrollment = await tx.enrollment.findFirst({
          where: {
            studentId,
            courseId: assessment.courseId,
            status: "ACTIVE",
            student: {
              role: "STUDENT",
              status: "ACTIVE",
            },
          },
        });

        if (
          !authorizedAssessment ||
          !activeEnrollment ||
          grade > authorizedAssessment.maxGrade
        ) {
          throw new Error("Grade authorization failed.");
        }

        // Find the previous grade
        const existingGrade = await tx.grade.findUnique({
          where: {
            studentId_assessmentId: {
              studentId,
              assessmentId,
            },
          },
        });

        // Create or update the grade
        const updatedGrade = await tx.grade.upsert({
          where: {
            studentId_assessmentId: {
              studentId,
              assessmentId,
            },
          },
          create: {
            studentId,
            assessmentId,
            grade,
            gradedById: instructorRecord.id,
          },
          update: {
            grade,
            gradedById: instructorRecord.id,
          },
        });

        // Record the change in the database audit log
        await tx.activityLog.create({
          data: {
            userId: instructorRecord.id,
            targetUserId: studentId,
            action: "EDIT_GRADE",
            success: true,
            details: JSON.stringify({
              courseCode: assessment.course.courseCode,
              assessmentId,
              previousGrade: existingGrade?.grade ?? null,
              newGrade: grade,
            }),
          },
        });

        return updatedGrade;
      }
    );

    return Response.json({
      message: "Grade saved successfully.",
      grade: savedGrade.grade,
    });
  } catch (error) {
    console.error("Gradebook PUT error:", error);

    return Response.json(
      { message: "Unable to save grade." },
      { status: 500 }
    );
  }
}
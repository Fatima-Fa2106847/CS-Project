import { cookies } from "next/headers";
import prisma from "../../../../lib/prisma.js";
import { getUserForSession } from "../../../../lib/auth-service";
import { AUTH_SESSION_COOKIE } from "../../../../lib/auth-constants";

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

    const instructor = await getUserForSession(token);

    if (!instructor || instructor.role !== "instructor") {
      return Response.json(
        { message: "Instructor access required." },
        { status: 403 }
      );
    }

    const courses = await prisma.course.findMany({
      where: {
        instructor: {
          universityId: instructor.id,
        },
      },
      include: {
        enrollments: {
          where: {
            status: "ACTIVE",
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        courseCode: "asc",
      },
    });

    return Response.json({
      courses: courses.map((course) => ({
        id: course.id,
        code: course.courseCode,
        name: course.courseName,
        students: course.enrollments.length,
        description: "",
      })),
    });
  } catch (error) {
    console.error("Instructor courses error:", error);

    return Response.json(
      { message: "Unable to retrieve instructor courses." },
      { status: 500 }
    );
  }
}
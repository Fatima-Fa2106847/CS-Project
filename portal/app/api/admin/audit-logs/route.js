import { getAuthenticatedAdmin } from "../../../../lib/admin-auth";
import prisma from "../../../../lib/prisma.js";

export async function GET() {
  try {
    // Only administrators can view security logs
    const admin = await getAuthenticatedAdmin();

    if (!admin) {
      return Response.json(
        { message: "Administrator access required." },
        { status: 403 }
      );
    }

    // Retrieve recent security events from the database
    const logs = await prisma.activityLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
      select: {
        id: true,
        action: true,
        success: true,
        details: true,
        createdAt: true,
        userId: true,
      },
    });

    return Response.json({ logs });
  } catch (error) {
    console.error("Unable to retrieve audit logs:", error);

    return Response.json(
      { message: "Unable to retrieve audit logs." },
      { status: 500 }
    );
  }
}
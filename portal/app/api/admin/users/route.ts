import { getAuthenticatedAdmin } from "../../../../lib/admin-auth";
import {
  approveStudentRegistration,
  getManagedUsers,
} from "../../../../lib/auth-service";

export async function GET() {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return Response.json({ message: "Administrator access required." }, { status: 403 });
  }

  return Response.json({ users: await getManagedUsers() });
}

export async function POST(request: Request) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return Response.json({ message: "Administrator access required." }, { status: 403 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid approval request." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("userId" in body) ||
    typeof body.userId !== "string" ||
    !body.userId.trim() ||
    body.userId.length > 64
  ) {
    return Response.json({ message: "A valid user ID is required." }, { status: 400 });
  }

  const approved = await approveStudentRegistration(body.userId);

  if (!approved) {
    return Response.json(
      { message: "No pending student registration was found for that ID." },
      { status: 409 }
    );
  }

  return Response.json({ message: "Student account approved." });
}
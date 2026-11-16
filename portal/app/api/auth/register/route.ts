import { registerStudent } from "../../../../lib/database";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid registration request." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("userId" in body) ||
    typeof body.userId !== "string" ||
    !("name" in body) ||
    typeof body.name !== "string" ||
    !("password" in body) ||
    typeof body.password !== "string"
  ) {
    return Response.json(
      { message: "Enter your university ID, name, and password." },
      { status: 400 }
    );
  }

  const userId = body.userId.trim();
  const name = body.name.trim();

  if (
    !userId ||
    userId.length > 64 ||
    /\s/.test(userId) ||
    !name ||
    name.length > 100 ||
    body.password.length < 8 ||
    body.password.length > 128
  ) {
    return Response.json(
      {
        message:
          "Use a valid ID and name, and a password between 8 and 128 characters.",
      },
      { status: 400 }
    );
  }

  const created = registerStudent(userId, name, body.password);

  if (!created) {
    return Response.json(
      { message: "An account with that university ID already exists." },
      { status: 409 }
    );
  }

  return Response.json(
    { message: "Registration submitted. An administrator must approve your account before you can log in." },
    { status: 201 }
  );
}

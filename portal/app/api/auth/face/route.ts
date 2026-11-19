
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

import prisma from "../../../../lib/prisma.js";
import { AUTH_SESSION_COOKIE } from "../../../../lib/auth-constants";

const FACE_DISTANCE_THRESHOLD = 0.55;
const ATTEMPT_DURATION = 60 * 1000;
const DESCRIPTOR_LENGTH = 128;

function validDescriptor(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === DESCRIPTOR_LENGTH &&
    value.every(
      (item) =>
        typeof item === "number" &&
        Number.isFinite(item) &&
        Math.abs(item) <= 2
    )
  );
}

function calculateDistance(a: number[], b: number[]) {
  let sum = 0;

  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }

  return Math.sqrt(sum);
}

async function getPendingAccount() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;

  if (!token) return null;

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (
    !session ||
    session.status !== "PENDING" ||
    session.revokedAt !== null ||
    session.expiresAt.getTime() <= Date.now() ||
    session.user.status !== "ACTIVE"
  ) {
    return null;
  }

  return { session, user: session.user };
}

// Check whether the account has a registered face.
export async function GET() {
  try {
    const account = await getPendingAccount();

    if (!account) {
      return Response.json(
        { message: "No valid pending session." },
        { status: 401 }
      );
    }

    return Response.json({
      userId: account.user.universityId,
      name: account.user.name,
      role: account.user.role.toLowerCase(),
      enrolled: Boolean(account.user.faceTemplateRef),
    });
  } catch (error) {
    console.error("Face status error:", error);

    return Response.json(
      { message: "Unable to check face registration." },
      { status: 500 }
    );
  }
}

// Register a face or verify an already registered face.
export async function POST(request: Request) {
  try {
    const account = await getPendingAccount();

    if (!account) {
      return Response.json(
        { message: "Your verification session has expired." },
        { status: 401 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { message: "Invalid face data." },
        { status: 400 }
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("descriptor" in body) ||
      !validDescriptor(body.descriptor) ||
      !("livenessPassed" in body) ||
      body.livenessPassed !== true
    ) {
      return Response.json(
        { message: "Valid face data and liveness verification are required." },
        { status: 400 }
      );
    }

    const descriptor = body.descriptor;

    let faceMatched = false;
    let distance: number | null = null;
    let challengeType = "FACE_RECOGNITION";

    if (!account.user.faceTemplateRef) {
      // First-time face enrollment.
      await prisma.user.update({
        where: { id: account.user.id },
        data: {
          faceTemplateRef: JSON.stringify(descriptor),
        },
      });

      faceMatched = true;
      challengeType = "FACE_ENROLLMENT";
    } else {
      // Compare the new capture with the registered descriptor.
      let savedDescriptor: unknown;

      try {
        savedDescriptor = JSON.parse(
          account.user.faceTemplateRef
        );
      } catch {
        return Response.json(
          { message: "Stored face data is invalid. Contact the administrator." },
          { status: 500 }
        );
      }

      if (!validDescriptor(savedDescriptor)) {
        return Response.json(
          { message: "Stored face data is invalid." },
          { status: 500 }
        );
      }

      distance = calculateDistance(
        descriptor,
        savedDescriptor
      );

      faceMatched = distance <= FACE_DISTANCE_THRESHOLD;
    }

    const now = new Date();

    // Record the result for the authentication service.
    await prisma.authAttempt.create({
      data: {
        userId: account.user.id,
        challengeType,
        challengeExpiresAt: new Date(
          now.getTime() + ATTEMPT_DURATION
        ),
        challengeUsedAt: faceMatched ? null : now,
        faceMatched,
        livenessPassed: true,
        success: faceMatched,
        failureReason: faceMatched
          ? null
          : "Face does not match the registered account.",
      },
    });

    if (!faceMatched) {
      return Response.json(
        {
          success: false,
          message: "Face not recognized. Please try again.",
          distance,
        },
        { status: 403 }
      );
    }

    return Response.json({
      success: true,
      enrolled: true,
      message: account.user.faceTemplateRef
        ? "Face verification successful."
        : "Face registration successful.",
      distance,
    });
  } catch (error) {
    console.error("Face authentication error:", error);

    return Response.json(
      { message: "Face authentication failed. Please try again." },
      { status: 500 }
    );
  }
}

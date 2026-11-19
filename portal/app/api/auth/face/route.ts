import type { Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";

import {
  generateChallenge,
  hashChallenge,
  getChallengeExpiration,
} from "../../../../lib/security/challenges.js";

import { encryptFace, decryptFace } from "../../../../lib/security/faceEncryption.js";
import { isFaceLocked } from "../../../../lib/security/faceAttempts.js";

import prisma from "../../../../lib/prisma.js";
import { AUTH_SESSION_COOKIE } from "../../../../lib/auth-constants";

const FACE_DISTANCE_THRESHOLD = 0.55;
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

// Generate a unique authentication challenge.
export async function PUT() {
  try {
    const account = await getPendingAccount();

    if (!account) {
      return Response.json(
        { message: "No valid pending session." },
        { status: 401 }
      );
    }

    // Check facial authentication cooldown.
    if (await isFaceLocked(account.user.id)) {
      return Response.json(
        { message: "Too many failed face attempts. Try again in 30 seconds." },
        { status: 429 }
      );
    }

    const challenge = generateChallenge();
    const expiresAt = getChallengeExpiration();

    await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {

        // Invalidate previous unfinished challenges.
        await tx.authAttempt.updateMany({
          where: {
            sessionId: account.session.id,
            challengeUsedAt: null,
            faceMatched: null,
          },
          data: {
            challengeUsedAt: new Date(),
          },
        });

        // Store the hashed challenge for this session.
        await tx.authAttempt.create({
          data: {
            userId: account.user.id,
            sessionId: account.session.id,
            challengeHash: hashChallenge(challenge),
            challengeType: account.user.faceTemplateRef
              ? "FACE_RECOGNITION"
              : "FACE_ENROLLMENT",
            challengeExpiresAt: expiresAt,
          },
        });
      }
    );

    return Response.json({
      challenge,
      expiresAt: expiresAt.getTime(),
    });

  } catch (error) {
    console.error("Challenge generation error:", error);

    return Response.json(
      { message: "Unable to generate authentication challenge." },
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

    // Check facial authentication cooldown.
    if (await isFaceLocked(account.user.id)) {
      return Response.json(
        { message: "Too many failed face attempts. Try again in 30 seconds." },
        { status: 429 }
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

    // Validate face data, liveness and challenge.
    if (
      typeof body !== "object" ||
      body === null ||
      !("descriptor" in body) ||
      !validDescriptor(body.descriptor) ||
      !("livenessPassed" in body) ||
      body.livenessPassed !== true ||
      !("challenge" in body) ||
      typeof body.challenge !== "string" ||
      !/^[a-f0-9]{64}$/.test(body.challenge)
    ) {
      return Response.json(
        { message: "Valid face data, liveness and challenge are required." },
        { status: 400 }
      );
    }

    const descriptor = body.descriptor;

    // Validate the challenge for this specific session.
    const attempt = await prisma.authAttempt.findFirst({
      where: {
        userId: account.user.id,
        sessionId: account.session.id,
        challengeHash: hashChallenge(body.challenge),
        challengeUsedAt: null,
        faceMatched: null,
        challengeExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!attempt) {
      return Response.json(
        { message: "Invalid, expired or already submitted challenge." },
        { status: 403 }
      );
    }

    let faceMatched = false;
    let distance: number | null = null;

    if (!account.user.faceTemplateRef) {
      // First-time face enrollment.
      faceMatched = true;

    } else {
      // Compare the new capture with the registered descriptor.
      let savedDescriptor: unknown;

      try {
        savedDescriptor = decryptFace(
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

    // Record the result and prevent challenge reuse.
    const recorded = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {

        const result = await tx.authAttempt.updateMany({
          where: {
            id: attempt.id,
            sessionId: account.session.id,
            challengeUsedAt: null,
            faceMatched: null,
            challengeExpiresAt: {
              gt: new Date(),
            },
            session: {
              is: {
                status: "PENDING",
                revokedAt: null,
                expiresAt: {
                  gt: new Date(),
                },
                user: {
                  is: {
                    status: "ACTIVE",
                  },
                },
              },
            },
          },
          data: {
            faceMatched,
            livenessPassed: true,
            success: faceMatched,
            challengeUsedAt: faceMatched ? null : now,
            failureReason: faceMatched
              ? null
              : "Face does not match the registered account.",
          },
        });

        if (result.count !== 1) {
          return false;
        }

        // Store encrypted facial data during enrollment.
        if (!account.user.faceTemplateRef && faceMatched) {
          const enrollment = await tx.user.updateMany({
            where: {
              id: account.user.id,
              faceTemplateRef: null,
              status: "ACTIVE",
            },
            data: {
              faceTemplateRef: encryptFace(descriptor),
            },
          });

          if (enrollment.count !== 1) {
            throw new Error(
              "Face registration has already changed."
            );
          }
        }

        return true;
      }
    );

    if (!recorded) {
      return Response.json(
        { message: "Challenge expired, already submitted or session invalid." },
        { status: 403 }
      );
    }

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
import type { Prisma } from "@prisma/client";
import { randomBytes, createHash } from "node:crypto";

import prisma from "./prisma.js";
import { verifyPassword } from "./security/passwords.js";
import {
  isLocked,
  recordFailedAttempt,
  resetAttempts,
} from "./security/loginAttempts.js";
import type { SessionRole } from "./sessions";

export type DatabaseUser = {
  id: string;
  name: string;
  role: SessionRole;
  enrolledCourses: string[];
  assignedCourses: string[];
};

type StoredUser = DatabaseUser & {
  passwordHash: string;
  status: "pending" | "active";
};

const SESSION_DURATION = 30 * 60 * 1000;

// Convert Prisma user information to the format used by the website.
function readDatabaseUser(
  user: {
    universityId: string;
    name: string;
    role: string;
    enrollments?: {
      course: {
        courseCode: string;
      };
    }[];
    taughtCourses?: {
      courseCode: string;
    }[];
  } | null
): DatabaseUser | null {
  if (!user) {
    return null;
  }

  return {
    id: user.universityId,
    name: user.name,
    role: user.role.toLowerCase() as SessionRole,
    enrolledCourses: (user.enrollments ?? []).map(
      (item) => item.course.courseCode
    ),
    assignedCourses: (user.taughtCourses ?? []).map(
      (course) => course.courseCode
    ),
  };
}

function readStoredUser(
  user: {
    universityId: string;
    name: string;
    role: string;
    passwordHash: string;
    status: string;
    enrollments?: {
      course: {
        courseCode: string;
      };
    }[];
    taughtCourses?: {
      courseCode: string;
    }[];
  } | null
): StoredUser | null {
  const databaseUser = readDatabaseUser(user);

  if (!databaseUser || !user) {
    return null;
  }

  return {
    ...databaseUser,
    passwordHash: user.passwordHash,
    status: user.status === "ACTIVE" ? "active" : "pending",
  };
}

async function getUserById(
  userId: string
): Promise<StoredUser | null> {
  const user = await prisma.user.findUnique({
    where: {
      universityId: userId,
    },
    include: {
      enrollments: {
        include: {
          course: true,
        },
      },
      taughtCourses: true,
    },
  });

  return readStoredUser(user);
}

export type LoginResult =
  | { success: true; user: DatabaseUser }
  | { success: false; reason: "invalid" | "locked" | "pending" };

export async function authenticateUser(
  userId: string,
  password: string
): Promise<LoginResult> {
  const normalizedId = userId.trim();

  if (!normalizedId || !password) {
    return { success: false, reason: "invalid" };
  }

  if (await isLocked(normalizedId)) {
    return { success: false, reason: "locked" };
  }

  const user = await getUserById(normalizedId);

  const passwordMatches = user
    ? await verifyPassword(user.passwordHash, password)
    : false;

  if (!user || !passwordMatches) {
    const prismaUser = await prisma.user.findUnique({
      where: {
        universityId: normalizedId,
      },
    });

    await recordFailedAttempt(
      normalizedId,
      prismaUser?.id ?? null
    );

    const locked = await isLocked(normalizedId);

    return {
      success: false,
      reason: locked ? "locked" : "invalid",
    };
  }

  if (user.status !== "active") {
    return { success: false, reason: "pending" };
  }

  await resetAttempts(normalizedId);

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      role: user.role,
      enrolledCourses: user.enrolledCourses,
      assignedCourses: user.assignedCourses,
    },
  };
}

export type ManagedDatabaseUser = {
  id: string;
  name: string;
  role: SessionRole;
  status: "pending" | "active";
};

// Public registration is disabled.
// Accounts are created using your Prisma seed script.
export async function registerStudent(
  userId: string,
  name: string,
  password: string
): Promise<boolean> {
  return false;
}

export async function getManagedUsers(): Promise<
  ManagedDatabaseUser[]
> {
  const users = await prisma.user.findMany({
    orderBy: {
      universityId: "asc",
    },
  });

  return users.map((user: {
    universityId: string;
    name: string;
    role: string;
    status: string;
  }) => ({
    id: user.universityId,
    name: user.name,
    role: user.role.toLowerCase() as SessionRole,
    status: user.status === "ACTIVE" ? "active" : "pending",
  }));
}

// Public registration approval is disabled.
export async function approveStudentRegistration(
  userId: string
): Promise<boolean> {
  return false;
}

export async function createAuthSession(
  userId: string,
  requiresVerification: boolean
): Promise<{
  token: string;
  expiresAt: number;
}> {
  const user = await prisma.user.findUnique({
    where: {
      universityId: userId,
    },
  });

  if (!user || user.status !== "ACTIVE") {
    throw new Error("User account is not active.");
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_DURATION;

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  await prisma.session.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: new Date(expiresAt),
      status: "PENDING",
    },
  });

  return { token, expiresAt };
}

async function getUserForAuthStatus(
  token: string,
  status: "pending" | "active"
): Promise<(DatabaseUser & { expiresAt: number }) | null> {
  if (!token) {
    return null;
  }

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: {
        include: {
          enrollments: {
            include: {
              course: true,
            },
          },
          taughtCourses: true,
        },
      },
    },
  });

  if (
    !session ||
    session.expiresAt.getTime() <= Date.now() ||
    session.revokedAt !== null ||
    session.status !== status.toUpperCase() ||
    session.user.status !== "ACTIVE"
  ) {
    return null;
  }

  const user = readDatabaseUser(session.user);

  if (!user) {
    return null;
  }

  return {
    ...user,
    expiresAt: session.expiresAt.getTime(),
  };
}

export async function getUserForSession(
  token: string
): Promise<(DatabaseUser & { expiresAt: number }) | null> {
  return getUserForAuthStatus(token, "active");
}

export async function getUserForVerification(
  token: string
): Promise<(DatabaseUser & { expiresAt: number }) | null> {
  return getUserForAuthStatus(token, "pending");
}

export async function completeAuthVerification(
  token: string,
  role: SessionRole
): Promise<boolean> {
  if (!token) {
    return false;
  }

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  const session = await prisma.session.findUnique({
    where: {
      tokenHash,
    },
    include: {
      user: true,
    },
  });

  if (
    !session ||
    session.status !== "PENDING" ||
    session.revokedAt !== null ||
    session.expiresAt.getTime() <= Date.now() ||
    session.user.status !== "ACTIVE" ||
    session.user.role.toLowerCase() !== role
  ) {
    return false;
  }

  // Only activate a session when the server has recorded
  // successful face recognition and liveness verification.
  const verification = await prisma.authAttempt.findFirst({
    where: {
      userId: session.userId,
      success: true,
      faceMatched: true,
      livenessPassed: true,
      challengeUsedAt: null,
      challengeExpiresAt: {
        gt: new Date(),
      },
      createdAt: {
        gte: session.createdAt,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!verification) {
    return false;
  }

  return prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
      const used = await tx.authAttempt.updateMany({
        where: {
          id: verification.id,
          challengeUsedAt: null,
          challengeExpiresAt: {
            gt: new Date(),
          },
        },
        data: {
          challengeUsedAt: new Date(),
        },
      });

      if (used.count !== 1) {
        return false;
      }

      const result = await tx.session.updateMany({
        where: {
          id: session.id,
          status: "PENDING",
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
        data: {
          status: "ACTIVE",
        },
      });

      if (result.count !== 1) {
        throw new Error("Unable to activate verified session.");
      }

      return true;
    }
  );
}

export async function deleteAuthSession(
  token: string
): Promise<void> {
  if (!token) {
    return;
  }

  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  await prisma.session.updateMany({
    where: {
      tokenHash,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
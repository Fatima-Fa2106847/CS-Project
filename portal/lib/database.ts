import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  DatabaseSync,
} from "node:sqlite";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";

import { demoUsers } from "./demo-users";
import type { SessionRole } from "./sessions";

export type DatabaseUser = {
  id: string;
  name: string;
  role: SessionRole;
  enrolledCourses: string[];
  assignedCourses: string[];
};

type StoredUser = DatabaseUser & {
  passwordHash: Uint8Array;
  passwordSalt: Uint8Array;
  status: "pending" | "active";
};

const SESSION_DURATION = 30 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60 * 1000;
const DEMO_PASSWORDS: Record<SessionRole, string> = {
  student: "student123",
  instructor: "instructor123",
  admin: "admin123",
};

const globalDatabase = globalThis as typeof globalThis & {
  portalDatabase?: DatabaseSync;
};

function openDatabase(): DatabaseSync {
  const databaseFile = process.env.PORTAL_DATABASE_PATH
    ? resolve(process.env.PORTAL_DATABASE_PATH)
    : join(process.cwd(), "data", "portal.sqlite");

  mkdirSync(dirname(databaseFile), { recursive: true });

  const database = new DatabaseSync(databaseFile);
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY COLLATE NOCASE,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
      password_hash BLOB NOT NULL,
      password_salt BLOB NOT NULL,
      enrolled_courses TEXT NOT NULL,
      assigned_courses TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('pending', 'active'))
    );

    CREATE TABLE IF NOT EXISTS login_attempts (
      user_id TEXT PRIMARY KEY COLLATE NOCASE,
      attempts INTEGER NOT NULL,
      locked_until INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS login_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL COLLATE NOCASE REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('pending', 'active'))
    );
  `);

  database.exec("BEGIN IMMEDIATE");
  try {
    const userColumns = database.prepare("PRAGMA table_info(users)")
      .all() as { name: string }[];
    if (!userColumns.some((column) => column.name === "status")) {
      database.exec(`
        ALTER TABLE users
        ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
          CHECK (status IN ('pending', 'active'))
      `);
    }

    const sessionColumns = database.prepare("PRAGMA table_info(login_sessions)")
      .all() as { name: string }[];
    if (!sessionColumns.some((column) => column.name === "status")) {
      database.exec(`
        ALTER TABLE login_sessions
        ADD COLUMN status TEXT NOT NULL DEFAULT 'active'
          CHECK (status IN ('pending', 'active'))
      `);
    }

    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }

  const insertUser = database.prepare(`
    INSERT OR IGNORE INTO users (
      id, name, role, password_hash, password_salt,
      enrolled_courses, assigned_courses, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
  `);

  for (const user of demoUsers) {
    const salt = randomBytes(16);
    const passwordHash = scryptSync(
      DEMO_PASSWORDS[user.role],
      salt,
      64
    );

    insertUser.run(
      user.id,
      user.name,
      user.role,
      passwordHash,
      salt,
      JSON.stringify(user.enrolledCourses),
      JSON.stringify(user.assignedCourses)
    );
  }

  return database;
}

const database = globalDatabase.portalDatabase ?? openDatabase();
globalDatabase.portalDatabase = database;

function readDatabaseUser(
  row: Record<string, unknown> | undefined
): DatabaseUser | null {
  if (
    !row ||
    typeof row.id !== "string" ||
    typeof row.name !== "string" ||
    typeof row.role !== "string" ||
    !["student", "instructor", "admin"].includes(row.role) ||
    typeof row.enrolled_courses !== "string" ||
    typeof row.assigned_courses !== "string"
  ) {
    return null;
  }

  const enrolledCourses: unknown = JSON.parse(row.enrolled_courses);
  const assignedCourses: unknown = JSON.parse(row.assigned_courses);

  if (
    !Array.isArray(enrolledCourses) ||
    !enrolledCourses.every((course) => typeof course === "string") ||
    !Array.isArray(assignedCourses) ||
    !assignedCourses.every((course) => typeof course === "string")
  ) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    role: row.role as SessionRole,
    enrolledCourses,
    assignedCourses,
  };
}

function readStoredUser(
  row: Record<string, unknown> | undefined
): StoredUser | null {
  const user = readDatabaseUser(row);

  if (
    !user ||
    !row ||
    !(row.password_hash instanceof Uint8Array) ||
    !(row.password_salt instanceof Uint8Array) ||
    (row.status !== "active" && row.status !== "pending")
  ) {
    return null;
  }

  return {
    ...user,
    passwordHash: row.password_hash,
    passwordSalt: row.password_salt,
    status: row.status,
  };
}

function getUserById(userId: string): StoredUser | null {
  const row = database.prepare(`
    SELECT id, name, role, password_hash, password_salt,
      enrolled_courses, assigned_courses, status
    FROM users
    WHERE id = ? COLLATE NOCASE
  `).get(userId) as Record<string, unknown> | undefined;

  return readStoredUser(row);
}

export type LoginResult =
  | { success: true; user: DatabaseUser }
  | { success: false; reason: "invalid" | "locked" | "pending" };

export function authenticateUser(
  userId: string,
  password: string
): LoginResult {
  const normalizedId = userId.trim().toUpperCase();
  const now = Date.now();
  const attempts = database.prepare(`
    SELECT attempts, locked_until
    FROM login_attempts
    WHERE user_id = ? COLLATE NOCASE
  `).get(normalizedId) as
    | { attempts: number; locked_until: number }
    | undefined;

  if (attempts && attempts.locked_until > now) {
    return { success: false, reason: "locked" };
  }

  const user = getUserById(normalizedId);
  const salt = user?.passwordSalt ?? Buffer.alloc(16, 0x5a);
  const expectedHash = user?.passwordHash
    ?? scryptSync("not-a-real-password", salt, 64);
  const actualHash = scryptSync(password, salt, 64);
  const passwordMatches = timingSafeEqual(actualHash, expectedHash);

  if (!user || !passwordMatches) {
    const failedAttempts = attempts?.locked_until && attempts.locked_until <= now
      ? 1
      : (attempts?.attempts ?? 0) + 1;
    const locked = failedAttempts >= MAX_LOGIN_ATTEMPTS;
    const lockedUntil = locked ? now + LOCKOUT_DURATION : 0;

    database.prepare(`
      INSERT INTO login_attempts (user_id, attempts, locked_until)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        attempts = excluded.attempts,
        locked_until = excluded.locked_until
    `).run(normalizedId, failedAttempts, lockedUntil);

    return { success: false, reason: locked ? "locked" : "invalid" };
  }

  if (user.status !== "active") {
    return { success: false, reason: "pending" };
  }

  database.prepare("DELETE FROM login_attempts WHERE user_id = ?")
    .run(user.id);

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

export function registerStudent(
  userId: string,
  name: string,
  password: string
): boolean {
  const normalizedId = userId.trim().toUpperCase();
  const normalizedName = name.trim();
  const salt = randomBytes(16);
  const passwordHash = scryptSync(password, salt, 64);

  const result = database.prepare(`
    INSERT INTO users (
      id, name, role, password_hash, password_salt,
      enrolled_courses, assigned_courses, status
    ) VALUES (?, ?, 'student', ?, ?, '[]', '[]', 'pending')
    ON CONFLICT(id) DO NOTHING
  `).run(normalizedId, normalizedName, passwordHash, salt);

  return result.changes === 1;
}

export function getManagedUsers(): ManagedDatabaseUser[] {
  const rows = database.prepare(`
    SELECT id, name, role, status
    FROM users
    ORDER BY CASE status WHEN 'pending' THEN 0 ELSE 1 END, id COLLATE NOCASE
  `).all() as Record<string, unknown>[];

  return rows.map((row) => {
    if (
      typeof row.id !== "string" ||
      typeof row.name !== "string" ||
      typeof row.role !== "string" ||
      !["student", "instructor", "admin"].includes(row.role) ||
      (row.status !== "pending" && row.status !== "active")
    ) {
      throw new Error("The users database contains an invalid account record.");
    }

    return {
      id: row.id,
      name: row.name,
      role: row.role as SessionRole,
      status: row.status,
    };
  });
}

export function approveStudentRegistration(userId: string): boolean {
  const result = database.prepare(`
    UPDATE users
    SET status = 'active'
    WHERE id = ? COLLATE NOCASE
      AND role = 'student'
      AND status = 'pending'
  `).run(userId.trim());

  return result.changes === 1;
}

export function createAuthSession(
  userId: string,
  requiresVerification: boolean
): {
  token: string;
  expiresAt: number;
} {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_DURATION;
  const tokenHash = createHash("sha256").update(token).digest("hex");

  database.prepare(`
    INSERT INTO login_sessions (token_hash, user_id, expires_at, status)
    VALUES (?, ?, ?, ?)
  `).run(
    tokenHash,
    userId,
    expiresAt,
    requiresVerification ? "pending" : "active"
  );

  return { token, expiresAt };
}

function getUserForAuthStatus(
  token: string,
  status: "pending" | "active"
): (DatabaseUser & {
  expiresAt: number;
}) | null {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const row = database.prepare(`
    SELECT u.id, u.name, u.role, u.enrolled_courses, u.assigned_courses,
      s.expires_at
    FROM login_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND s.status = ?
  `).get(tokenHash, Date.now(), status) as
    | Record<string, unknown>
    | undefined;

  if (!row) return null;

  const user = readDatabaseUser(row);

  if (!user || typeof row.expires_at !== "number") return null;

  return { ...user, expiresAt: row.expires_at };
}

export function getUserForSession(token: string): (DatabaseUser & {
  expiresAt: number;
}) | null {
  return getUserForAuthStatus(token, "active");
}

export function getUserForVerification(token: string): (DatabaseUser & {
  expiresAt: number;
}) | null {
  return getUserForAuthStatus(token, "pending");
}

export function completeAuthVerification(
  token: string,
  role: SessionRole
): boolean {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const result = database.prepare(`
    UPDATE login_sessions
    SET status = 'active'
    WHERE token_hash = ?
      AND expires_at > ?
      AND status = 'pending'
      AND user_id IN (SELECT id FROM users WHERE role = ?)
  `).run(tokenHash, Date.now(), role);

  return result.changes === 1;
}

export function deleteAuthSession(token: string): void {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  database.prepare("DELETE FROM login_sessions WHERE token_hash = ?")
    .run(tokenHash);
}

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AuthAttempt" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER,
    "challengeHash" TEXT,
    "challengeType" TEXT NOT NULL,
    "challengeExpiresAt" DATETIME NOT NULL,
    "challengeUsedAt" DATETIME,
    "faceMatched" BOOLEAN,
    "livenessPassed" BOOLEAN,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "failureReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuthAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AuthAttempt" ("challengeExpiresAt", "challengeType", "challengeUsedAt", "createdAt", "faceMatched", "failureReason", "id", "livenessPassed", "success", "userId") SELECT "challengeExpiresAt", "challengeType", "challengeUsedAt", "createdAt", "faceMatched", "failureReason", "id", "livenessPassed", "success", "userId" FROM "AuthAttempt";
DROP TABLE "AuthAttempt";
ALTER TABLE "new_AuthAttempt" RENAME TO "AuthAttempt";
CREATE UNIQUE INDEX "AuthAttempt_challengeHash_key" ON "AuthAttempt"("challengeHash");
CREATE INDEX "AuthAttempt_userId_createdAt_idx" ON "AuthAttempt"("userId", "createdAt");
CREATE INDEX "AuthAttempt_sessionId_idx" ON "AuthAttempt"("sessionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

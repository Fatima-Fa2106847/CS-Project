import prisma from "../prisma.js";

const MAX_ATTEMPTS = 3;
const COOLDOWN = 30 * 1000;

// Check whether facial verification is temporarily locked
export async function isFaceLocked(userId) {

    const attempts = await prisma.authAttempt.findMany({
        where: {
            userId: userId,
            faceMatched: {
                not: null
            }
        },
        orderBy: {
            id: "asc"
        }
    });

    let failedCount = 0;
    let lockedUntil = 0;

    for (const attempt of attempts) {

        const attemptTime =
            (attempt.challengeUsedAt ?? attempt.createdAt).getTime();

        // Ignore attempts made during the cooldown
        if (attemptTime < lockedUntil) {
            continue;
        }

        // Reset attempts after the cooldown ends
        if (lockedUntil !== 0 && attemptTime >= lockedUntil) {
            failedCount = 0;
            lockedUntil = 0;
        }

        // Reset failed attempts after successful verification
        if (attempt.success) {
            failedCount = 0;
        } else {
            failedCount++;
        }

        // Lock facial verification after 3 failed attempts
        if (failedCount >= MAX_ATTEMPTS) {
            lockedUntil = attemptTime + COOLDOWN;
            failedCount = 0;
        }
    }

    return Date.now() < lockedUntil;
}
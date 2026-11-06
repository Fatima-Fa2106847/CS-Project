
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60 * 1000; // 1 minute

type LoginAttempt = {
  attempts: number;
  lockedUntil: number;
};

function getStorageKey(userId: string): string {
  return `login_${userId.trim().toUpperCase()}`;
}

// Read and validate stored login attempts
function getLoginData(userId: string): LoginAttempt {
  if (typeof window === "undefined") {
    return { attempts: 0, lockedUntil: 0 };
  }

  try {
    const stored = localStorage.getItem(getStorageKey(userId));

    if (!stored) {
      return { attempts: 0, lockedUntil: 0 };
    }

    const data = JSON.parse(stored);

    if (
      data === null ||
      typeof data !== "object" ||
      !Number.isInteger(data.attempts) ||
      data.attempts < 0 ||
      data.attempts > MAX_ATTEMPTS ||
      !Number.isFinite(data.lockedUntil) ||
      data.lockedUntil < 0
    ) {
      localStorage.removeItem(getStorageKey(userId));
      return { attempts: 0, lockedUntil: 0 };
    }

    return data as LoginAttempt;
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

// Check whether an account is currently locked
export function isAccountLocked(userId: string): boolean {
  if (
    typeof window === "undefined" ||
    typeof userId !== "string" ||
    !userId.trim()
  ) {
    return false;
  }

  const data = getLoginData(userId);

  if (data.lockedUntil === 0) return false;

  if (Date.now() >= data.lockedUntil) {
    try {
      localStorage.removeItem(getStorageKey(userId));
    } catch {
      // Storage may be unavailable.
    }

    return false;
  }

  return true;
}

// Record a failed login attempt
export function recordFailedLogin(userId: string): number {
  if (
    typeof window === "undefined" ||
    typeof userId !== "string" ||
    !userId.trim()
  ) {
    return 0;
  }

  if (isAccountLocked(userId)) return 0;

  const data = getLoginData(userId);

  data.attempts = Math.min(data.attempts + 1, MAX_ATTEMPTS);

  if (data.attempts >= MAX_ATTEMPTS) {
    data.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }

  try {
    localStorage.setItem(
      getStorageKey(userId),
      JSON.stringify(data)
    );
  } catch {
    // Storage may be unavailable.
  }

  return MAX_ATTEMPTS - data.attempts;
}

// Reset failed attempts after successful login
export function resetLoginAttempts(userId: string): void {
  if (
    typeof window !== "undefined" &&
    typeof userId === "string" &&
    userId.trim()
  ) {
    try {
      localStorage.removeItem(getStorageKey(userId));
    } catch {
      // Storage may be unavailable.
    }
  }
}

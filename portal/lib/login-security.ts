
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60 * 1000; // 1 minute

type LoginAttempt = {
  attempts: number;
  lockedUntil: number;
};

export function isAccountLocked(userId: string): boolean {
  const stored = localStorage.getItem(`login_${userId}`);

  if (!stored) return false;

  const data: LoginAttempt = JSON.parse(stored);

  if (Date.now() >= data.lockedUntil && data.lockedUntil !== 0) {
    localStorage.removeItem(`login_${userId}`);
    return false;
  }

  return data.lockedUntil > Date.now();
}

export function recordFailedLogin(userId: string): number {
  const stored = localStorage.getItem(`login_${userId}`);

  const data: LoginAttempt = stored
    ? JSON.parse(stored)
    : { attempts: 0, lockedUntil: 0 };

  data.attempts += 1;

  if (data.attempts >= MAX_ATTEMPTS) {
    data.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }

  localStorage.setItem(`login_${userId}`, JSON.stringify(data));

  return MAX_ATTEMPTS - data.attempts;
}

export function resetLoginAttempts(userId: string) {
  localStorage.removeItem(`login_${userId}`);
}

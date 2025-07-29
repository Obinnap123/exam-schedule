interface RateLimitStore {
  [key: string]: {
    attempts: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting
// In production, you might want to use Redis or another persistent store
const loginAttempts: RateLimitStore = {};

// Maximum attempts allowed before timeout
const MAX_ATTEMPTS = 5;
// Timeout duration in milliseconds (15 minutes)
const TIMEOUT_MS = 15 * 60 * 1000;

export function checkLoginRateLimit(email: string): {
  allowed: boolean;
  timeLeft?: number;
  attemptsLeft?: number;
} {
  const now = Date.now();
  const userAttempts = loginAttempts[email];

  // If no previous attempts or reset time has passed
  if (!userAttempts || now > userAttempts.resetTime) {
    loginAttempts[email] = {
      attempts: 0,
      resetTime: now + TIMEOUT_MS,
    };
    return { allowed: true, attemptsLeft: MAX_ATTEMPTS };
  }

  // If user is in timeout
  if (userAttempts.attempts >= MAX_ATTEMPTS) {
    const timeLeft = userAttempts.resetTime - now;
    if (timeLeft > 0) {
      return {
        allowed: false,
        timeLeft,
        attemptsLeft: 0,
      };
    }
    // Reset if timeout has passed
    loginAttempts[email] = {
      attempts: 0,
      resetTime: now + TIMEOUT_MS,
    };
    return { allowed: true, attemptsLeft: MAX_ATTEMPTS };
  }

  return {
    allowed: true,
    attemptsLeft: MAX_ATTEMPTS - userAttempts.attempts,
  };
}

export function incrementLoginAttempts(email: string): void {
  if (!loginAttempts[email]) {
    loginAttempts[email] = {
      attempts: 0,
      resetTime: Date.now() + TIMEOUT_MS,
    };
  }
  loginAttempts[email].attempts++;
}

export function resetLoginAttempts(email: string): void {
  delete loginAttempts[email];
}

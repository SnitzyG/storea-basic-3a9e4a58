interface LoginAttempt {
  count: number;
  lastAttempt: number;
  lockedUntil?: number;
}

export class LoginAttemptTracker {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private static readonly PROGRESSIVE_DELAYS = [0, 1000, 3000, 5000, 10000]; // Progressive delays in ms
  
  private attempts = new Map<string, LoginAttempt>();

  isBlocked(identifier: string): { blocked: boolean; remainingTime?: number; requiresCaptcha?: boolean } {
    const attempt = this.attempts.get(identifier);
    
    if (!attempt) {
      return { blocked: false };
    }

    const now = Date.now();
    
    // Check if account is locked
    if (attempt.lockedUntil && now < attempt.lockedUntil) {
      return { 
        blocked: true, 
        remainingTime: Math.ceil((attempt.lockedUntil - now) / 1000) 
      };
    }

    // Clear lockout if expired
    if (attempt.lockedUntil && now >= attempt.lockedUntil) {
      this.attempts.delete(identifier);
      return { blocked: false };
    }

    // Require CAPTCHA after 3 failed attempts
    if (attempt.count >= 3) {
      return { blocked: false, requiresCaptcha: true };
    }

    return { blocked: false };
  }

  recordFailedAttempt(identifier: string): { delay: number; lockout?: number } {
    const now = Date.now();
    const attempt = this.attempts.get(identifier) || { count: 0, lastAttempt: 0 };
    
    attempt.count++;
    attempt.lastAttempt = now;

    // Progressive lockout
    if (attempt.count >= LoginAttemptTracker.MAX_ATTEMPTS) {
      attempt.lockedUntil = now + LoginAttemptTracker.LOCKOUT_DURATION;
      this.attempts.set(identifier, attempt);
      return { 
        delay: 0, 
        lockout: Math.ceil(LoginAttemptTracker.LOCKOUT_DURATION / 1000) 
      };
    }

    this.attempts.set(identifier, attempt);
    
    // Return progressive delay
    const delayIndex = Math.min(attempt.count - 1, LoginAttemptTracker.PROGRESSIVE_DELAYS.length - 1);
    return { delay: LoginAttemptTracker.PROGRESSIVE_DELAYS[delayIndex] };
  }

  recordSuccessfulLogin(identifier: string): void {
    this.attempts.delete(identifier);
  }

  getAttemptCount(identifier: string): number {
    return this.attempts.get(identifier)?.count || 0;
  }

  // Cleanup old attempts (call periodically)
  cleanup(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    for (const [key, attempt] of this.attempts.entries()) {
      if (now - attempt.lastAttempt > oneHour && (!attempt.lockedUntil || now > attempt.lockedUntil)) {
        this.attempts.delete(key);
      }
    }
  }
}

export const loginTracker = new LoginAttemptTracker();

// Cleanup every 10 minutes
setInterval(() => loginTracker.cleanup(), 10 * 60 * 1000);
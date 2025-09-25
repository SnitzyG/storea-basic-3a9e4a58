import { z } from 'zod';

export interface PasswordStrengthResult {
  isValid: boolean;
  score: number;
  feedback: string[];
  breachCheckPassed?: boolean;
}

export class PasswordValidator {
  private static readonly MIN_LENGTH = 8;
  private static readonly COMMON_PASSWORDS = new Set([
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    'dragon', 'master', 'login', 'pass', 'hello'
  ]);

  static validatePassword(password: string): PasswordStrengthResult {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < this.MIN_LENGTH) {
      feedback.push(`Password must be at least ${this.MIN_LENGTH} characters long`);
    } else {
      score += 1;
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
      feedback.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      feedback.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      feedback.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Common password check
    if (this.COMMON_PASSWORDS.has(password.toLowerCase())) {
      feedback.push('This password is too common. Please choose a more unique password');
      score = Math.max(0, score - 2);
    }

    // Sequential characters check
    if (this.hasSequentialChars(password)) {
      feedback.push('Avoid using sequential characters (like 123 or abc)');
      score = Math.max(0, score - 1);
    }

    const isValid = feedback.length === 0 && score >= 4;

    return {
      isValid,
      score,
      feedback
    };
  }

  static async checkHaveIBeenPwned(password: string): Promise<boolean> {
    try {
      const sha1Hash = await this.sha1(password);
      const prefix = sha1Hash.substring(0, 5);
      const suffix = sha1Hash.substring(5).toUpperCase();

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
      const text = await response.text();
      
      return !text.includes(suffix);
    } catch (error) {
      console.warn('HaveIBeenPwned check failed:', error);
      // Return true (not breached) if API call fails to avoid blocking users
      return true;
    }
  }

  private static async sha1(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private static hasSequentialChars(password: string): boolean {
    for (let i = 0; i < password.length - 2; i++) {
      const char1 = password.charCodeAt(i);
      const char2 = password.charCodeAt(i + 1);
      const char3 = password.charCodeAt(i + 2);
      
      if (char2 === char1 + 1 && char3 === char2 + 1) {
        return true;
      }
    }
    return false;
  }
}

export const passwordSchema = z.string()
  .min(8, `Password must be at least 8 characters`)
  .refine((password) => {
    const result = PasswordValidator.validatePassword(password);
    return result.isValid;
  }, {
    message: "Password does not meet security requirements"
  });
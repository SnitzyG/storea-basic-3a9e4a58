import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { PasswordValidator, PasswordStrengthResult } from '@/lib/security/passwordValidator';
import { loginTracker } from '@/lib/security/loginAttemptTracker';
import { SessionManager } from '@/lib/security/sessionManager';
import { CSRFProtection } from '@/lib/security/csrfProtection';
import { toast } from '@/hooks/use-toast';

interface SecureAuthState {
  passwordStrength: PasswordStrengthResult | null;
  isBlocked: boolean;
  remainingLockoutTime: number;
  requiresCaptcha: boolean;
  captchaVerified: boolean;
  sessionManager: SessionManager | null;
}

interface SecureSignInOptions {
  email: string;
  password: string;
  captchaVerified?: boolean;
}

interface SecureSignUpOptions {
  email: string;
  password: string;
  name: string;
  role: string;
  company?: string;
}

export const useSecureAuth = () => {
  const auth = useAuth();
  const [state, setState] = useState<SecureAuthState>({
    passwordStrength: null,
    isBlocked: false,
    remainingLockoutTime: 0,
    requiresCaptcha: false,
    captchaVerified: false,
    sessionManager: null,
  });

  // Initialize session manager
  useEffect(() => {
    const sessionManager = new SessionManager(() => {
      // Handle session expiration
      toast({
        title: "Session Expired",
        description: "Your session has expired due to inactivity. Please sign in again.",
        variant: "destructive"
      });
      auth.signOut();
    });

    setState(prev => ({ ...prev, sessionManager }));

    return () => {
      sessionManager.destroy();
    };
  }, [auth]);

  // Start session when user signs in
  useEffect(() => {
    if (auth.user && state.sessionManager) {
      state.sessionManager.startSession();
    }
  }, [auth.user, state.sessionManager]);

  const checkPasswordStrength = useCallback(async (password: string) => {
    const strength = PasswordValidator.validatePassword(password);
    
    // Check against HaveIBeenPwned if password meets basic requirements
    if (strength.isValid) {
      const breachCheckPassed = await PasswordValidator.checkHaveIBeenPwned(password);
      strength.breachCheckPassed = breachCheckPassed;
      
      if (!breachCheckPassed) {
        strength.isValid = false;
        strength.feedback.push('This password has been found in data breaches');
      }
    }
    
    setState(prev => ({ ...prev, passwordStrength: strength }));
    return strength;
  }, []);

  const secureSignIn = useCallback(async (options: SecureSignInOptions) => {
    const { email, password, captchaVerified = false } = options;
    const identifier = email.toLowerCase();
    
    // Check if login is blocked
    const blockStatus = loginTracker.isBlocked(identifier);
    
    if (blockStatus.blocked) {
      setState(prev => ({
        ...prev,
        isBlocked: true,
        remainingLockoutTime: blockStatus.remainingTime || 0
      }));
      
      toast({
        title: "Account Temporarily Locked",
        description: `Too many failed attempts. Try again in ${Math.ceil((blockStatus.remainingTime || 0) / 60)} minutes.`,
        variant: "destructive"
      });
      
      return { error: { message: "Account locked" } };
    }
    
    // Check if CAPTCHA is required
    if (blockStatus.requiresCaptcha && !captchaVerified) {
      setState(prev => ({ ...prev, requiresCaptcha: true }));
      return { error: { message: "CAPTCHA required" } };
    }
    
    // Add CSRF protection
    const csrfToken = CSRFProtection.getToken();
    if (!csrfToken) {
      CSRFProtection.generateToken();
    }
    
    // Attempt sign in
    const result = await auth.signIn(email, password);
    
    if (result.error) {
      // Record failed attempt
      const failureResult = loginTracker.recordFailedAttempt(identifier);
      
      if (failureResult.lockout) {
        setState(prev => ({
          ...prev,
          isBlocked: true,
          remainingLockoutTime: failureResult.lockout || 0
        }));
        
        toast({
          title: "Account Locked",
          description: `Too many failed attempts. Account locked for ${Math.ceil((failureResult.lockout || 0) / 60)} minutes.`,
          variant: "destructive"
        });
      } else if (failureResult.delay > 0) {
        // Apply progressive delay
        await new Promise(resolve => setTimeout(resolve, failureResult.delay));
      }
      
      // Update CAPTCHA requirement
      const newBlockStatus = loginTracker.isBlocked(identifier);
      setState(prev => ({
        ...prev,
        requiresCaptcha: newBlockStatus.requiresCaptcha || false
      }));
    } else {
      // Record successful login
      loginTracker.recordSuccessfulLogin(identifier);
      setState(prev => ({
        ...prev,
        isBlocked: false,
        remainingLockoutTime: 0,
        requiresCaptcha: false,
        captchaVerified: false
      }));
    }
    
    return result;
  }, [auth]);

  const secureSignUp = useCallback(async (options: SecureSignUpOptions) => {
    const { email, password, name, role, company } = options;
    
    // Validate password strength
    const strength = await checkPasswordStrength(password);
    
    if (!strength.isValid) {
      toast({
        title: "Password Too Weak",
        description: "Please choose a stronger password that meets all security requirements.",
        variant: "destructive"
      });
      return { error: { message: "Password does not meet security requirements" } };
    }
    
    // Add CSRF protection
    const csrfToken = CSRFProtection.getToken();
    if (!csrfToken) {
      CSRFProtection.generateToken();
    }
    
    const result = await auth.signUp(email, password, name, role, company);
    
    if (!result.error) {
      toast({
        title: "Account Created",
        description: "Your account has been created with enhanced security features enabled.",
      });
    }
    
    return result;
  }, [auth, checkPasswordStrength]);

  const verifyCaptcha = useCallback((success: boolean) => {
    setState(prev => ({ ...prev, captchaVerified: success }));
    
    if (success) {
      setState(prev => ({ ...prev, requiresCaptcha: false }));
    }
  }, []);

  const resetSecurityState = useCallback(() => {
    setState(prev => ({
      ...prev,
      passwordStrength: null,
      isBlocked: false,
      remainingLockoutTime: 0,
      requiresCaptcha: false,
      captchaVerified: false
    }));
  }, []);

  // Update lockout timer
  useEffect(() => {
    if (state.remainingLockoutTime > 0) {
      const timer = setInterval(() => {
        setState(prev => ({
          ...prev,
          remainingLockoutTime: Math.max(0, prev.remainingLockoutTime - 1)
        }));
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [state.remainingLockoutTime]);

  return {
    ...auth,
    ...state,
    checkPasswordStrength,
    secureSignIn,
    secureSignUp,
    verifyCaptcha,
    resetSecurityState,
  };
};
import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { useAuth } from '@/hooks/useAuth';
import { PasswordStrengthIndicator } from '@/components/security/PasswordStrengthIndicator';
import { CaptchaChallenge } from '@/components/security/CaptchaChallenge';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePageMeta } from '@/hooks/usePageMeta';
import { isProfileComplete } from '@/utils/profileUtils';
import { useAnalytics } from '@/hooks/useAnalytics';

const Auth = () => {
  usePageMeta({
    title: 'Login – STOREA',
    description: 'Access your STOREA account and manage your projects securely.',
    index: false
  });

  const {
    user,
    loading,
    passwordStrength,
    isBlocked,
    remainingLockoutTime,
    requiresCaptcha,
    captchaVerified,
    checkPasswordStrength,
    secureSignIn,
    secureSignUp,
    verifyCaptcha,
    resetSecurityState
  } = useSecureAuth();
  const { profile } = useAuth();
  const { trackSignup } = useAnalytics();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [showWipeButton, setShowWipeButton] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  // Removed early return to keep hooks order consistent and avoid hook mismatch errors during loading state

  useEffect(() => {
    // Check if user came from email confirmation
    if (searchParams.get('confirmed') === 'true') {
      setEmailConfirmed(true);
    }
    
    // Check if this is a password reset link
    if (searchParams.get('reset') === 'true') {
      setIsPasswordReset(true);
    }
  }, [searchParams]);
  useEffect(() => {
    if (user && !loading) {
      // Check for redirect_to parameter first
      const redirectTo = searchParams.get('redirect_to');
      if (redirectTo) {
        navigate(redirectTo);
        return;
      }

      // Check for pending invitation tokens
      const pendingToken = localStorage.getItem('pending_project_token') || sessionStorage.getItem('pending_invitation_token');
      if (pendingToken) {
        // Store for later use after profile setup
        sessionStorage.setItem('pendingInvitationToken', pendingToken);
        
        // Determine the invitation URL
        let invitationUrl = '';
        if (pendingToken.startsWith('proj_')) {
          invitationUrl = `/invite/${pendingToken}`;
        } else {
          invitationUrl = `/join/${pendingToken}`;
        }
        sessionStorage.setItem('pendingInvitationUrl', invitationUrl);
        
        // Clear the old tokens
        localStorage.removeItem('pending_project_token');
        sessionStorage.removeItem('pending_invitation_token');
      }

      // Check if profile is complete
      if (!isProfileComplete(profile)) {
        navigate('/profile-setup');
        return;
      }

      // If there was a pending invitation and profile is complete, go there
      const pendingUrl = sessionStorage.getItem('pendingInvitationUrl');
      if (pendingUrl) {
        sessionStorage.removeItem('pendingInvitationToken');
        sessionStorage.removeItem('pendingInvitationUrl');
        navigate(pendingUrl);
      } else {
        navigate('/projects');
      }
    }
  }, [user, profile, loading, navigate, searchParams]);
  // Remove this since navigation is now handled in useEffect
  // This prevents double navigation
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) {
      toast.error(`Account is locked. Please try again in ${Math.ceil(remainingLockoutTime / 60)} minutes.`);
      return;
    }
    if (requiresCaptcha && !captchaVerified) {
      setShowCaptcha(true);
      return;
    }
    setIsSubmitting(true);
    const result = await secureSignIn({
      email,
      password,
      captchaVerified: requiresCaptcha ? captchaVerified : true
    });
    if (result.error?.message === "CAPTCHA required") {
      setShowCaptcha(true);
    }
    setIsSubmitting(false);
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!passwordStrength?.isValid) {
      toast.error('Please ensure your password meets all security requirements');
      return;
    }
    setIsSubmitting(true);
    const result = await secureSignUp({
      email,
      password,
      name,
      role,
      company
    });
    
    // Track successful signup
    if (!result?.error) {
      trackSignup('email');
    }
    
    setIsSubmitting(false);
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: resetEmail }
      });

      if (error) {
        console.error('Password reset (edge) error:', error);
        toast.error(error.message || 'Failed to send password reset email');
      } else {
        toast.success('Password reset email sent! Please check your inbox (and spam folder).');
        setShowForgotPassword(false);
        setResetEmail('');
      }
    } catch (error) {
      console.error('Unexpected error during password reset:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error('Please enter a new password');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated successfully! You can now sign in with your new password.');
        setIsPasswordReset(false);
        setNewPassword('');
        setConfirmNewPassword('');
        // Clear URL parameters
        navigate('/auth', { replace: true });
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  };
  const handleDataWipe = async () => {
    const password = prompt('Enter the test password to wipe all data:');
    if (!password) return;
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('wipe-test-data', {
        body: {
          password
        }
      });
      if (error) {
        toast.error('Failed to wipe data: ' + error.message);
        return;
      }
      if (data.success) {
        toast.success('✅ All user data has been cleared successfully!');
        // Force reload the page to clear any cached state
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to wipe data');
      }
    } catch (error) {
      console.error('Error wiping data:', error);
      toast.error('An unexpected error occurred');
    }
  };

  // Show wipe button after clicking bottom-right corner multiple times
  useEffect(() => {
    let clickCount = 0;
    let clickTimeout: NodeJS.Timeout;
    const handleCornerClick = (e: MouseEvent) => {
      const {
        innerWidth,
        innerHeight
      } = window;
      const {
        clientX,
        clientY
      } = e;

      // Check if click is in bottom-right corner (last 80px of both dimensions for easier targeting)
      if (clientX > innerWidth - 80 && clientY > innerHeight - 80) {
        clickCount++;
        console.log(`Corner click ${clickCount}/3`); // Debug log

        // Reset counter after 3 seconds of no clicks
        clearTimeout(clickTimeout);
        clickTimeout = setTimeout(() => {
          clickCount = 0;
        }, 3000);
        if (clickCount >= 3) {
          setShowWipeButton(true);
          toast.info('🧪 Test data wipe button activated');
          clickCount = 0; // Reset counter
        }
      } else {
        // Reset if clicking elsewhere
        clickCount = 0;
        clearTimeout(clickTimeout);
      }
    };
    window.addEventListener('click', handleCornerClick);
    return () => {
      window.removeEventListener('click', handleCornerClick);
      clearTimeout(clickTimeout);
    };
  }, []);

  // Handle password changes for strength checking
  const handlePasswordChange = async (newPassword: string) => {
    setPassword(newPassword);
    if (newPassword.length > 0) {
      await checkPasswordStrength(newPassword);
    }
  };

  // Handle CAPTCHA verification
  const handleCaptchaVerify = (success: boolean) => {
    verifyCaptcha(success);
    setShowCaptcha(false);
    if (success) {
      // Retry login after successful CAPTCHA
      handleSignIn({
        preventDefault: () => {}
      } as React.FormEvent);
    }
  };

  // Reset security state when switching tabs
  const handleTabChange = () => {
    resetSecurityState();
    setPassword('');
    setConfirmPassword('');
    setEmail('');
    setName('');
    setCompany('');
    setRole('');
  };
  const roleOptions = [{
    value: 'builder',
    label: 'Builder'
  }, {
    value: 'architect',
    label: 'Architect'
  }, {
    value: 'homeowner',
    label: 'Homeowner'
  }, {
    value: 'contractor',
    label: 'Contractor'
  }];
  return <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      {loading && <div className="fixed inset-0 grid place-items-center bg-background/80 z-50">
          <div className="text-center">Loading...</div>
        </div>}
      
      <div className="w-full max-w-md">
        {emailConfirmed && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✓ Email confirmed! You can now sign in to your account.
            </p>
          </div>}

        <Card className="w-full">
          <CardHeader className="text-center space-y-6 pt-10 pb-6">
            <div className="flex justify-center">
              <StorealiteLogo variant="icon-only" className="h-16 w-auto" />
            </div>
            
            <div className="space-y-2">
              <CardDescription className="text-base">
                {isPasswordReset 
                  ? 'Enter your new password below' 
                  : 'Sign in to your account or create a new one'
                }
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {isPasswordReset ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    placeholder="Enter your new password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-new-password" 
                    type="password" 
                    placeholder="Confirm your new password" 
                    value={confirmNewPassword} 
                    onChange={e => setConfirmNewPassword(e.target.value)} 
                    required 
                  />
                </div>
                
                <Button type="submit" className="w-full">
                  Update Password
                </Button>
                
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="w-full text-sm" 
                  onClick={() => {
                    setIsPasswordReset(false);
                    navigate('/auth', { replace: true });
                  }}
                >
                  Back to Sign In
                </Button>
              </form>
            ) : (
            <Tabs defaultValue="signup" className="w-full" onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="min-h-[400px]">
                {!showForgotPassword ? <form onSubmit={handleSignIn} className="space-y-4">
                    {isBlocked && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm text-destructive">
                          🔒 Account temporarily locked due to too many failed attempts. 
                          Try again in {Math.ceil(remainingLockoutTime / 60)} minutes.
                        </p>
                      </div>}
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input id="signin-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required disabled={isBlocked} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Input id="signin-password" type={isPasswordVisible ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={isBlocked} />
                        
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isSubmitting || isBlocked}>
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => setShowForgotPassword(true)}>
                      Forgot Password?
                    </Button>
                  </form> : <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <Input id="reset-email" type="email" placeholder="Enter your email to reset password" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                    </div>
                    <Button type="submit" className="w-full">
                      Send Reset Email
                    </Button>
                    <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => setShowForgotPassword(false)}>
                      Back to Sign In
                    </Button>
                  </form>}
              </TabsContent>

              <TabsContent value="signup" className="min-h-[400px]">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input id="signup-name" type="text" placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" placeholder="Create a password" value={password} onChange={e => handlePasswordChange(e.target.value)} required />
                    {passwordStrength && <PasswordStrengthIndicator result={passwordStrength} />}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                    {confirmPassword && password !== confirmPassword && <p className="text-sm text-destructive">Passwords do not match</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Your Role</Label>
                    <Select value={role} onValueChange={setRole} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map(option => <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {role && role !== 'homeowner' && <div className="space-y-2">
                      <Label htmlFor="company">Company *</Label>
                      <Input id="company" type="text" placeholder="Enter your company name" value={company} onChange={e => setCompany(e.target.value)} required={role !== 'homeowner'} />
                    </div>}
                   <Button type="submit" className="w-full" disabled={isSubmitting || !passwordStrength?.isValid || !role || role !== 'homeowner' && !company.trim()}>
                     {isSubmitting ? 'Creating account...' : 'Create Account'}
                   </Button>
                </form>
              </TabsContent>
            </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Hidden data wipe button for testing */}
      {showWipeButton && <Button onClick={handleDataWipe} variant="ghost" size="sm" className="fixed bottom-4 right-4 opacity-50 hover:opacity-100 transition-opacity text-xs bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 z-50" style={{
      userSelect: 'none'
    }}>
          🧪 Wipe Test Data
        </Button>}
    </div>;
};
export default Auth;
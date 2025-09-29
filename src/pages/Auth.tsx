import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecureAuth } from '@/hooks/useSecureAuth';
import { PasswordStrengthIndicator } from '@/components/security/PasswordStrengthIndicator';
import { CaptchaChallenge } from '@/components/security/CaptchaChallenge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const Auth = () => {
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
    if (user) {
      // Check for pending invitation tokens
      const pendingToken = localStorage.getItem('pending_project_token') || sessionStorage.getItem('pending_invitation_token');
      if (pendingToken) {
        // Clear the stored token
        localStorage.removeItem('pending_project_token');
        sessionStorage.removeItem('pending_invitation_token');

        // Navigate to the appropriate invitation handler
        if (pendingToken.startsWith('proj_')) {
          navigate(`/invite/${pendingToken}`);
        } else {
          navigate(`/join/${pendingToken}`);
        }
      } else {
        navigate('/projects');
      }
    }
  }, [user, navigate]);
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
    await secureSignUp({
      email,
      password,
      name,
      role,
      company
    });
    setIsSubmitting(false);
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error('Please enter your email address');
      return;
    }
    try {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth?reset=true`
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password reset email sent! Check your inbox and click the link to reset your password.');
        setShowForgotPassword(false);
        setResetEmail('');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
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
    value: 'lead_contractor',
    label: 'Lead Contractor'
  }, {
    value: 'lead_consultant',
    label: 'Lead Consultant'
  }, {
    value: 'client',
    label: 'Client'
  }, {
    value: 'contractor',
    label: 'Contractor'
  }];
  return <div className="min-h-screen flex items-center justify-center bg-background px-4 relative">
      {loading && <div className="fixed inset-0 grid place-items-center bg-background/80 z-50">
          <div className="text-center">Loading...</div>
        </div>}
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center lg:items-stretch lg:justify-between gap-8">
        {/* Animated House Illustration */}
        <div className="w-full lg:w-1/2 flex justify-center lg:order-2">
          <Card className="w-full max-w-md">
            <CardContent>
              <div className="relative w-full">
                <svg viewBox="0 0 200 200" className="w-full h-auto">
                  {/* Construction staging - appearing sequentially */}
                  
                  {/* Ground/Site preparation */}
                  <rect x="30" y="170" width="140" height="20" className="fill-muted animate-[fadeInUp_0.6s_ease-out_0.2s_both]" />
                  
                  {/* Foundation */}
                  <rect x="40" y="160" width="120" height="10" className="fill-muted-foreground animate-[fadeInUp_0.6s_ease-out_0.6s_both]" />
                  
                  {/* Building the frame/structure */}
                  <g className="animate-[fadeInUp_0.8s_ease-out_1s_both]">
                    <rect x="50" y="120" width="100" height="40" className="fill-primary/10" stroke="hsl(var(--primary))" strokeWidth="2" />
                    {/* Frame details */}
                    <line x1="70" y1="120" x2="70" y2="160" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <line x1="100" y1="120" x2="100" y2="160" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <line x1="130" y1="120" x2="130" y2="160" stroke="hsl(var(--primary))" strokeWidth="1" />
                  </g>
                  
                  {/* Roof construction */}
                  <g className="animate-[fadeInUp_0.8s_ease-out_1.4s_both]">
                    <polygon points="45,120 100,80 155,120" className="fill-primary/80" />
                    {/* Roof beams */}
                    <line x1="100" y1="80" x2="75" y2="110" stroke="hsl(var(--primary-foreground))" strokeWidth="1" />
                    <line x1="100" y1="80" x2="125" y2="110" stroke="hsl(var(--primary-foreground))" strokeWidth="1" />
                  </g>
                  
                  {/* Installing windows */}
                  <g className="animate-[fadeIn_0.6s_ease-out_1.8s_both]">
                    <rect x="65" y="135" width="15" height="15" className="fill-secondary" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <line x1="72.5" y1="135" x2="72.5" y2="150" className="stroke-primary" strokeWidth="1" />
                    <line x1="65" y1="142.5" x2="80" y2="142.5" className="stroke-primary" strokeWidth="1" />
                  </g>
                  
                  <g className="animate-[fadeIn_0.6s_ease-out_2s_both]">
                    <rect x="120" y="135" width="15" height="15" className="fill-secondary" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <line x1="127.5" y1="135" x2="127.5" y2="150" className="stroke-primary" strokeWidth="1" />
                    <line x1="120" y1="142.5" x2="135" y2="142.5" className="stroke-primary" strokeWidth="1" />
                  </g>
                  
                  {/* Door installation */}
                  <g className="animate-[fadeIn_0.6s_ease-out_2.2s_both]">
                    <rect x="90" y="145" width="20" height="25" className="fill-accent" stroke="hsl(var(--primary))" strokeWidth="1" />
                    <circle cx="106" cy="157" r="1.5" className="fill-primary animate-[fadeIn_0.4s_ease-out_2.8s_both]" />
                  </g>
                  
                  {/* Final details - chimney and finishing touches */}
                  <g className="animate-[fadeInUp_0.6s_ease-out_2.4s_both]">
                    <rect x="125" y="85" width="8" height="20" className="fill-muted-foreground" />
                    {/* Roofing tiles effect */}
                    <path d="M 50 120 Q 100 115 150 120" stroke="hsl(var(--primary-foreground))" strokeWidth="1" fill="none" />
                  </g>
                  
                     {/* Smoke - sign of life/completion */}
                   <g className="animate-[fadeIn_0.8s_ease-out_3s_both]">
                     <circle cx="129" cy="80" r="2" className="fill-muted-foreground/40 animate-[float_3s_ease-in-out_3.2s_infinite]" />
                     <circle cx="131" cy="75" r="1.5" className="fill-muted-foreground/30 animate-[float_3s_ease-in-out_3.4s_infinite]" />
                     <circle cx="127" cy="72" r="1" className="fill-muted-foreground/20 animate-[float_3s_ease-in-out_3.6s_infinite]" />
                   </g>
                  
                  {/* Landscaping - final touch */}
                  <g className="animate-[fadeIn_0.6s_ease-out_3.2s_both]">
                    <ellipse cx="30" cy="175" rx="8" ry="4" className="fill-green-500/60" />
                    <ellipse cx="170" cy="175" rx="10" ry="5" className="fill-green-500/60" />
                  </g>
                </svg>
                
                {/* Updated STOREALite Logo */}
                <div className="mt-6 text-center animate-[fadeIn_0.8s_ease-out_3.4s_both]">
                  <h1 className="text-4xl font-bold tracking-wider">
                    <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-black">
                      STOREA
                    </span>
                    <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent font-light ml-1">
                      Lite
                    </span>
                  </h1>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Login Form Section */}
        <div className="w-full lg:w-1/2 lg:order-1 flex flex-col items-center justify-center">
          {emailConfirmed && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">
                ✓ Email confirmed! You can now sign in to your account.
              </p>
            </div>}

        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {isPasswordReset ? 'Reset Your Password' : 'Welcome'}
            </CardTitle>
            <CardDescription>
              {isPasswordReset 
                ? 'Enter your new password below' 
                : 'Sign in to your account or create a new one'
              }
            </CardDescription>
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
            <Tabs defaultValue="signin" className="w-full" onValueChange={handleTabChange}>
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
                    <div className="relative">
                      <Input id="signup-password" type={isPasswordVisible ? "text" : "password"} placeholder="Create a password" value={password} onChange={e => handlePasswordChange(e.target.value)} required />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1" onClick={() => setIsPasswordVisible(!isPasswordVisible)}>
                        {isPasswordVisible ? '🙈' : '👁️'}
                      </Button>
                    </div>
                    {passwordStrength && <PasswordStrengthIndicator result={passwordStrength} />}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <Input id="confirm-password" type={isPasswordVisible ? "text" : "password"} placeholder="Confirm your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
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
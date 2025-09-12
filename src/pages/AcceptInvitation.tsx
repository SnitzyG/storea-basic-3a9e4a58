import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AcceptInvitation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptanceSuccess, setAcceptanceSuccess] = useState(false);
  const [projectInfo, setProjectInfo] = useState<any>(null);
  
  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    // Check if user is already logged in
    checkAuthAndInvitation();
  }, [token]);

  const checkAuthAndInvitation = async () => {
    try {
      // Check current auth status
      const { data: { user } } = await supabase.auth.getUser();
      
      // Validate invitation token with enhanced data
      const { data: invitationData, error: invitationError } = await supabase
        .from('project_pending_invitations')
        .select(`
          id,
          email,
          role,
          expires_at,
          project_id,
          projects (
            name,
            description,
            address,
            created_by
          )
        `)
        .eq('invitation_token', token)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (invitationError || !invitationData) {
        setError('This invitation link is invalid or has expired.');
        setLoading(false);
        return;
      }

      setInvitation(invitationData);
      setEmail(invitationData.email);

      // Get project creator information for better UX
      if (invitationData.projects?.created_by) {
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('name, full_name')
          .eq('user_id', invitationData.projects.created_by)
          .single();
        
        setProjectInfo({
          ...invitationData.projects,
          creatorName: creatorProfile?.name || creatorProfile?.full_name || 'Project Administrator'
        });
      }

      if (user) {
        // User is already logged in, try to accept invitation
        await acceptInvitation(user.id);
      } else {
        // Check if this email already has an account
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const existingUser = authUsers?.users?.find((u: any) => u.email === invitationData.email);
        
        if (existingUser) {
          setIsSignUp(false); // Show sign in form
        } else {
          setIsSignUp(true);  // Show sign up form
        }
        
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking invitation:', error);
      setError('Failed to validate invitation');
      setLoading(false);
    }
  };

  const acceptInvitation = async (userId: string) => {
    try {
      setIsAccepting(true);
      
      const { data, error } = await supabase.rpc('accept_team_invitation', {
        invitation_token_param: token,
        user_id_param: userId
      });

      if (error) {
        throw error;
      }

      const result = data as { success: boolean; error?: string; project_id?: string };

      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invitation');
      }

      // Show success state
      setAcceptanceSuccess(true);
      
      toast({
        title: "🎉 Welcome to the team!",
        description: `You've successfully joined "${invitation?.projects?.name}".`,
      });

      // Auto-redirect after 5 seconds, but allow immediate navigation
      setTimeout(() => {
        navigate('/dashboard');
      }, 5000);
      
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'Failed to accept invitation');
      toast({
        title: "Failed to accept invitation",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || (isSignUp && !name)) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match.",
        variant: "destructive"
      });
      return;
    }

    if (isSignUp && password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    setIsSigningUp(true);

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/accept-invitation?token=${token}`,
            data: {
              name: name,
              role: 'contractor'
            }
          }
        });

        if (error) throw error;

        if (data.user && !data.session) {
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation email. Please check your inbox and click the link to verify your account.",
          });
          setIsSignUp(false); // Switch to sign in mode after signup
          return;
        }

        if (data.user) {
          await acceptInvitation(data.user.id);
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          await acceptInvitation(data.user.id);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invitation Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAccepting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p>Accepting invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state - invitation accepted
  if (acceptanceSuccess && invitation && projectInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600 mb-2">
              🎉 Welcome to the Team!
            </CardTitle>
            <CardDescription className="text-base">
              You've successfully joined the project team
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="font-semibold text-lg mb-3">Project Details</h3>
              <div className="space-y-2 text-left">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project:</span>
                  <span className="font-medium">{projectInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Role:</span>
                  <span className="font-medium capitalize">{invitation.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Project Lead:</span>
                  <span className="font-medium">{projectInfo.creatorName}</span>
                </div>
                {projectInfo.address && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location:</span>
                    <span className="font-medium">{projectInfo.address}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">What's Next?</h4>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>✓ Access project documents and files</li>
                <li>✓ Communicate with other team members</li>
                <li>✓ Track project progress and milestones</li>
                <li>✓ Submit and review RFIs (Requests for Information)</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={() => navigate('/dashboard')} 
                className="flex-1"
                size="lg"
              >
                Go to Dashboard
              </Button>
              <Button 
                onClick={() => navigate('/projects')} 
                variant="outline"
                className="flex-1"
                size="lg"
              >
                View Projects
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Redirecting to dashboard in 5 seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle className="text-xl">
            {isSignUp ? "Create Account" : "Sign In"}
          </CardTitle>
          <CardDescription>
            {isSignUp 
              ? "Create your account to join the project team" 
              : "Sign in to accept your team invitation"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {invitation && projectInfo && (
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-1">
                  <div><strong>Project:</strong> {projectInfo.name}</div>
                  <div><strong>Role:</strong> <span className="capitalize">{invitation.role}</span></div>
                  <div><strong>Invited by:</strong> {projectInfo.creatorName}</div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={!!invitation?.email}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
                required
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSigningUp}
              size="lg"
            >
              {isSigningUp && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSignUp ? "Create Account & Join Team" : "Sign In & Join Team"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-primary hover:underline"
              >
                {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
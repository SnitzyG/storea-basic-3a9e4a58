import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  
  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      
      // Validate invitation token
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
            description
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

      if (user) {
        // User is already logged in, try to accept invitation
        await acceptInvitation(user.id);
      } else {
        // User needs to sign up/in
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

      toast({
        title: "Welcome to the team!",
        description: `You've successfully joined the project team.`
      });

      // Redirect to the project
      navigate(`/projects`);
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError(error.message || 'Failed to accept invitation');
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
            description: "Please check your email for a confirmation link before accepting the invitation."
          });
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <UserPlus className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>Team Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {invitation && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You've been invited to join <strong>"{invitation.projects?.name}"</strong> as a <strong>{invitation.role}</strong>.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                {isSignUp ? "Create an account to accept the invitation" : "Sign in to accept the invitation"}
              </p>
            </div>

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
                placeholder="Enter your password"
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSigningUp}
            >
              {isSigningUp && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isSignUp ? "Create Account & Accept Invitation" : "Sign In & Accept Invitation"}
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
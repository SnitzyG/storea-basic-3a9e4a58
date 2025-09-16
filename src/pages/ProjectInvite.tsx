import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProjectInvite = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      handleProjectJoin();
    } else {
      // User needs to authenticate first
      handleUnauthenticatedUser();
    }
  }, [user, token]);

  const handleUnauthenticatedUser = async () => {
    try {
      if (!token) {
        throw new Error('Invalid invitation link');
      }

      // Verify the invitation token and get project info
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('invitation_token', token)
        .maybeSingle();

      if (projectError || !project) {
        throw new Error('Invalid or expired invitation link');
      }

      setProjectInfo(project);
      setError('Please sign in or create an account to join this project');
      setLoading(false);
    } catch (err: any) {
      console.error('Error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleProjectJoin = async () => {
    try {
      if (!user || !token) {
        return;
      }

      // Verify the invitation token and get project info
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('invitation_token', token)
        .maybeSingle();

      if (projectError || !project) {
        throw new Error('Invalid or expired invitation link');
      }

      setProjectInfo(project);

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('project_users')
        .select('id, role')
        .eq('project_id', project.id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: `You're already a member of ${project.name} as a ${existingMember.role}.`
        });
        navigate('/projects');
        return;
      }

      // Get project creator for invited_by field
      const { data: projectData } = await supabase
        .from('projects')
        .select('created_by')
        .eq('id', project.id)
        .single();

      // Add user to project team as contractor (default role for invitation links)
      const { error: memberError } = await supabase
        .from('project_users')
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: 'contractor',
          invited_by: projectData?.created_by || null,
          joined_at: new Date().toISOString()
        });

      if (memberError) {
        throw new Error('Failed to add you to the project: ' + memberError.message);
      }

      setSuccess(true);
      
      toast({
        title: "Welcome to the team!",
        description: `You've successfully joined ${project.name}.`
      });

      // Redirect to project after 2 seconds
      setTimeout(() => {
        navigate('/projects');
      }, 2000);

    } catch (err: any) {
      console.error('Project join error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthRedirect = () => {
    // Store the invitation token for after authentication
    sessionStorage.setItem('pending_invitation_token', token || '');
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h1 className="text-xl font-semibold mb-2">Processing invitation...</h1>
            <p className="text-muted-foreground">Please wait while we process your project invitation.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <UserPlus className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-semibold mb-4">Join Project</h1>
            {projectInfo && (
              <div className="mb-4 p-4 bg-accent rounded-lg">
                <h2 className="font-medium">{projectInfo.name}</h2>
                {projectInfo.description && (
                  <p className="text-sm text-muted-foreground mt-1">{projectInfo.description}</p>
                )}
              </div>
            )}
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-2">
              <Button onClick={handleAuthRedirect} className="w-full">
                Sign In / Sign Up to Join
              </Button>
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Go Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success && projectInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-green-600 mb-4">Welcome to the Team!</h1>
            <p className="text-muted-foreground mb-6">
              You've successfully joined <strong>{projectInfo.name}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">Redirecting you to projects...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default ProjectInvite;
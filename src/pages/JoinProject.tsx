import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const JoinProject = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && token) {
      handleProjectJoin();
    } else if (!user && token) {
      // Store token for after authentication
      localStorage.setItem('pending_project_token', token);
      navigate('/auth');
    }
  }, [user, token]);

  const handleProjectJoin = async () => {
    try {
      if (!user) {
        setError('Please sign in to join the project');
        setLoading(false);
        return;
      }

      if (!token) {
        throw new Error('Invalid invitation link');
      }

      // Find project by invitation token
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name, description, created_by')
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
          description: `You're already a member of ${project.name}.`
        });
        navigate('/projects');
        return;
      }

      // Add user to project as contractor (default role for invitation links)
      const { error: memberError } = await supabase
        .from('project_users')
        .insert({
          project_id: project.id,
          user_id: user.id,
          role: 'contractor',
          invited_by: project.created_by,
          joined_at: new Date().toISOString()
        });

      if (memberError) {
        throw new Error('Failed to join the project: ' + memberError.message);
      }

      // Get user profile for notification
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', user.id)
        .single();

      // Create notification for project creator
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: project.created_by,
          type: 'team_member_joined',
          title: 'New Team Member Joined',
          message: `${userProfile?.name || 'New member'} has joined "${project.name}" as a contractor.`,
          data: {
            project_id: project.id,
            project_name: project.name,
            member_name: userProfile?.name || 'New member',
            member_role: 'contractor',
            action_url: `/projects`
          }
        });

      if (notificationError) {
        console.warn('Failed to create notification:', notificationError);
      }


      // Clear any stored token
      localStorage.removeItem('pending_project_token');

      setSuccess(true);
      
      toast({
        title: "Welcome to the team!",
        description: `You've successfully joined ${project.name}.`
      });

      // Redirect to projects after 2 seconds
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

  // Check for pending token on component mount (after authentication)
  useEffect(() => {
    const pendingToken = localStorage.getItem('pending_project_token');
    if (user && pendingToken && !token) {
      localStorage.removeItem('pending_project_token');
      navigate(`/join/${pendingToken}`);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h1 className="text-xl font-semibold mb-2">Joining project...</h1>
            <p className="text-muted-foreground">Please wait while we add you to the team.</p>
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
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-destructive mb-4">Unable to Join Project</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/auth')} variant="default">
                Sign In / Sign Up
              </Button>
              <Button onClick={() => navigate('/projects')} variant="outline">
                Go to Projects
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
            <div className="flex items-center justify-center gap-2 mb-4">
              <Users className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">{projectInfo.name}</span>
            </div>
            <p className="text-muted-foreground mb-6">
              You've successfully joined the project as a team member.
            </p>
            <p className="text-sm text-muted-foreground">Redirecting you to projects...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default JoinProject;
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, Mail, UserPlus, RefreshCw, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  inviter_id: string;
  status: string;
  token: string;
  project_id: string;
}

interface TeamInvitationStatusCardProps {
  projectId: string;
  onInvitationUpdate?: () => void;
}

export function TeamInvitationStatusCard({ projectId, onInvitationUpdate }: TeamInvitationStatusCardProps) {
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPendingInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pending invitations:', error);
        return;
      }

      setPendingInvitations(data || []);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingInvitations();

    // Set up real-time subscription for invitation status updates
    const channel = supabase
      .channel(`project_invitations_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Invitation change detected:', payload);
          fetchPendingInvitations();
          onInvitationUpdate?.();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'project_users',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('New team member added:', payload);
          fetchPendingInvitations();
          onInvitationUpdate?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, onInvitationUpdate]);

  const resendInvitation = async (invitation: PendingInvitation) => {
    setResendingId(invitation.id);
    try {
      // Get project and inviter details
      const { data: project } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();

      const { data: inviter } = await supabase
        .from('profiles')
        .select('name, full_name')
        .eq('user_id', invitation.inviter_id)
        .single();

      const inviterName = inviter?.name || inviter?.full_name || 'Someone';
      const projectName = project?.name || 'Project';

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          projectId,
          email: invitation.email,
          role: invitation.role,
          projectName,
          inviterName,
        },
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Remove old invitation and the new one will be created
      await supabase
        .from('invitations')
        .delete()
        .eq('id', invitation.id);

      toast({
        title: "Invitation resent!",
        description: `New invitation sent to ${invitation.email}`,
      });

      fetchPendingInvitations();
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast({
        title: "Failed to resend invitation",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setResendingId(null);
    }
  };

  const cancelInvitation = async (invitationId: string, email: string) => {
    setCancelingId(invitationId);
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) {
        throw error;
      }

      toast({
        title: "Invitation cancelled",
        description: `Invitation to ${email} has been cancelled.`,
      });

      fetchPendingInvitations();
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Failed to cancel invitation",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
    } finally {
      setCancelingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <RefreshCw className="h-4 w-4 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingInvitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations
          </CardTitle>
          <CardDescription>
            No pending invitations at the moment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All team invitations have been processed. Use the "Add Member" button to invite new team members.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Pending Invitations
          <Badge variant="secondary" className="ml-2">
            {pendingInvitations.length}
          </Badge>
        </CardTitle>
        <CardDescription>
          Team members who have been invited but haven't joined yet
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingInvitations.map((invitation) => {
          const isExpiring = new Date(invitation.expires_at).getTime() - Date.now() < 24 * 60 * 60 * 1000; // Less than 24 hours
          
          return (
            <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-medium">{invitation.email}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {invitation.role}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Sent {formatDistanceToNow(new Date(invitation.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {isExpiring && (
                    <div className="text-xs text-amber-600 mt-1">
                      Expires {formatDistanceToNow(new Date(invitation.expires_at), { addSuffix: true })}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant={isExpiring ? "destructive" : "secondary"}
                  className="flex items-center gap-1"
                >
                  <Clock className="h-3 w-3" />
                  Pending
                </Badge>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resendInvitation(invitation)}
                  disabled={resendingId === invitation.id}
                >
                  {resendingId === invitation.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  Resend
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cancelInvitation(invitation.id, invitation.email)}
                  disabled={cancelingId === invitation.id}
                >
                  {cancelingId === invitation.id ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  Cancel
                </Button>
              </div>
            </div>
          );
        })}
        
        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Invitations expire after 7 days. Invited users will receive an email with instructions to join the project.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Mail, Clock, X, RefreshCw, Trash2 } from 'lucide-react';
import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PendingInvitationsDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PendingInvitationsDialog({ projectId, open, onOpenChange }: PendingInvitationsDialogProps) {
  const { pendingInvitations, loading, refreshInvitations } = usePendingInvitations(projectId);
  const { toast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const cancelInvitation = async (invitationId: string, email: string) => {
    setActionLoading(invitationId);
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitation cancelled",
        description: `Invitation to ${email} has been cancelled.`
      });

      await refreshInvitations();
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Error cancelling invitation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  const resendInvitation = async (invitation: any) => {
    setActionLoading(invitation.id);
    try {
      // Get current user session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Please log in again');
      }

      // Get project name for the resend
      const { data: projectData } = await supabase
        .from('projects')
        .select('name')
        .eq('id', projectId)
        .single();

      // Get inviter name
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, full_name')
        .eq('user_id', sessionData.session.user.id)
        .single();

      const inviterName = profile?.name || profile?.full_name || sessionData.session.user.email?.split('@')[0] || 'Someone';

      // Call the edge function to resend
      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          projectId,
          email: invitation.email,
          role: invitation.role,
          projectName: projectData?.name || 'Project',
          inviterName
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Invitation resent!",
        description: `Invitation sent again to ${invitation.email}.`
      });

      await refreshInvitations();
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast({
        title: "Error resending invitation",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invitations
          </DialogTitle>
          <DialogDescription>
            Manage pending team member invitations. You can resend or cancel invitations as needed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {!loading && pendingInvitations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No pending invitations</p>
              <p className="text-sm">All team invitations have been accepted or expired.</p>
            </div>
          )}

          {!loading && pendingInvitations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? 's' : ''}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshInvitations}
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {pendingInvitations.map((invitation) => (
                <Card key={invitation.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex-1">
                            <p className="font-medium truncate">{invitation.email}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {invitation.role}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Sent {formatDistanceToNow(new Date(invitation.created_at))} ago
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          Expires {formatDistanceToNow(new Date(invitation.expires_at))} from now
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resendInvitation(invitation)}
                          disabled={actionLoading === invitation.id}
                        >
                          {actionLoading === invitation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelInvitation(invitation.id, invitation.email)}
                          disabled={actionLoading === invitation.id}
                        >
                          {actionLoading === invitation.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
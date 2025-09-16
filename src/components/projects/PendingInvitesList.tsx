import { Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { usePendingInvitations } from '@/hooks/usePendingInvitations';
import { formatDistanceToNow } from 'date-fns';

interface PendingInvitesListProps {
  projectId: string;
}

export function PendingInvitesList({ projectId }: PendingInvitesListProps) {
  const { pendingInvitations, loading, refreshInvitations } = usePendingInvitations(projectId);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Mail className="h-4 w-4" /> Pending Invitations ({pendingInvitations.length})
        </h4>
        <Button variant="ghost" size="sm" onClick={refreshInvitations} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Loading pending invitations...</div>
      )}

      {!loading && pendingInvitations.length === 0 && (
        <div className="text-sm text-muted-foreground">No pending invitations</div>
      )}

      {!loading && pendingInvitations.length > 0 && (
        <div className="space-y-2">
          {pendingInvitations.map((invitation) => (
            <Card key={invitation.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{invitation.email}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Badge variant="secondary">{invitation.role}</Badge>
                    <span>Sent {formatDistanceToNow(new Date(invitation.created_at))} ago</span>
                    <span>•</span>
                    <span>Expires {formatDistanceToNow(new Date(invitation.expires_at))} from now</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, FileText, HelpCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useActivity } from '@/hooks/useActivity';
import { formatDistanceToNow } from 'date-fns';

interface TeamCollaborationCardProps {
  stats: {
    messagesLast24h: number;
    documentsLast7d: number;
    rfisPending: number;
    approvalsWaiting: number;
  } | null;
}

export const TeamCollaborationCard = ({ stats }: TeamCollaborationCardProps) => {
  const navigate = useNavigate();
  const { activities } = useActivity();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'document': return <FileText className="h-4 w-4" />;
      case 'rfi': return <HelpCircle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-blue-500/10 text-blue-500';
      case 'document': return 'bg-purple-500/10 text-purple-500';
      case 'rfi': return 'bg-orange-500/10 text-orange-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Team Collaboration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metrics Grid */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-lg bg-blue-500/10">
              <MessageSquare className="h-5 w-5 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.messagesLast24h}</div>
              <div className="text-xs text-muted-foreground">Messages (24h)</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-purple-500/10">
              <FileText className="h-5 w-5 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{stats.documentsLast7d}</div>
              <div className="text-xs text-muted-foreground">Documents (7d)</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-orange-500/10">
              <HelpCircle className="h-5 w-5 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{stats.rfisPending}</div>
              <div className="text-xs text-muted-foreground">RFIs Pending</div>
            </div>
            
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <CheckCircle className="h-5 w-5 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.approvalsWaiting}</div>
              <div className="text-xs text-muted-foreground">Approvals</div>
            </div>
          </div>
        )}

        {/* Recent Activity Feed */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Recent Activity</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {activities.slice(0, 8).map(activity => (
              <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {activity.description?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {activity.action || 'Activity'}
                    </span>
                    <Badge variant="outline" className={`${getActivityColor(activity.entity_type)} text-xs`}>
                      {activity.action}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {activity.description}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
            
            {activities.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity
              </div>
            )}
          </div>
        </div>

        <Button variant="outline" className="w-full" onClick={() => navigate('/messages')}>
          View All Activity
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

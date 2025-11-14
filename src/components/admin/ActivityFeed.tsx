import { useRealtimeActivity } from '@/hooks/useSystemActivity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const actionColors: Record<string, string> = {
  created: 'bg-green-500/10 text-green-500',
  updated: 'bg-blue-500/10 text-blue-500',
  deleted: 'bg-red-500/10 text-red-500',
  sent: 'bg-cyan-500/10 text-cyan-500',
  submitted: 'bg-indigo-500/10 text-indigo-500',
};

export function ActivityFeed() {
  const activities = useRealtimeActivity({ limit: 10 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="h-5 w-5 animate-pulse text-primary" />
          Live Activity Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {!activities || activities.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="secondary"
                        className={`${actionColors[activity.action] || ''} text-xs`}
                      >
                        {activity.action}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-sm truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.user?.name || 'Unknown User'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

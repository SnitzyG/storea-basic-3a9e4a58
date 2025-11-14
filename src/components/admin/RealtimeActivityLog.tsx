import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity } from 'lucide-react';
import { useActivity } from '@/hooks/useActivity';
import { formatDistanceToNow } from 'date-fns';

export const RealtimeActivityLog = () => {
  const { activities } = useActivity();
  const [filter, setFilter] = useState<string>('all');

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.entity_type === filter);

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'document': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'rfi': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'tender': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'message': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Activity Log
            <Badge variant="outline" className="ml-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
              Live
            </Badge>
          </CardTitle>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activity</SelectItem>
              <SelectItem value="project">Projects</SelectItem>
              <SelectItem value="document">Documents</SelectItem>
              <SelectItem value="rfi">RFIs</SelectItem>
              <SelectItem value="tender">Tenders</SelectItem>
              <SelectItem value="message">Messages</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredActivities.map(activity => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">
                  {activity.action?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {activity.action || 'Activity'}
                  </span>
                  <Badge variant="outline" className={`text-xs ${getActivityColor(activity.entity_type)}`}>
                    {activity.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {activity.description}
                </p>
                {activity.metadata && (
                  <div className="text-xs text-muted-foreground mt-1 font-mono">
                    {activity.entity_type} • ID: {activity.entity_id?.substring(0, 8)}...
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {filteredActivities.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                {filter !== 'all' ? 'Try changing the filter' : 'Activity will appear here in real-time'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

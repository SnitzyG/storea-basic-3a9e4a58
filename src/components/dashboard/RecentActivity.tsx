import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useActivity } from '@/hooks/useActivity';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  HelpCircle, 
  Briefcase, 
  FolderOpen,
  User,
  Clock,
  ExternalLink
} from 'lucide-react';

const activityIcons = {
  project: FolderOpen,
  document: FileText,
  message: MessageSquare,
  rfi: HelpCircle,
  tender: Briefcase,
  user: User,
};

const actionColors = {
  created: 'bg-green-500/10 text-green-700 border-green-500/20',
  updated: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  deleted: 'bg-red-500/10 text-red-700 border-red-500/20',
  assigned: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  completed: 'bg-gray-500/10 text-gray-700 border-gray-500/20',
  uploaded: 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  submitted: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20',
};

export const RecentActivity = () => {
  const { activities, loading } = useActivity();
  const navigate = useNavigate();

  const handleActivityClick = (activity: any) => {
    // Navigate to relevant tab based on entity type
    switch (activity.entity_type) {
      case 'message':
        navigate('/messages');
        break;
      case 'rfi':
        navigate('/rfis');
        break;
      case 'document':
        navigate('/documents');
        break;
      case 'tender':
        navigate('/tenders');
        break;
      case 'project':
        navigate('/projects');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            Loading activities...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {activities.length > 0 ? (
            <div className="p-6 space-y-4">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.entity_type as keyof typeof activityIcons] || User;
                return (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => handleActivityClick(activity)}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-xs">
                            {activity.user_profile?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">
                          {activity.user_profile?.name || 'Unknown User'}
                        </span>
                        <Badge 
                          className={actionColors[activity.action as keyof typeof actionColors] || actionColors.updated}
                          variant="outline"
                        >
                          {activity.action}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-foreground mb-2">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {activity.project?.name && (
                            <>
                              <span>{activity.project.name}</span>
                              <span>•</span>
                            </>
                          )}
                          <span>
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No recent activity</p>
              <p className="text-xs mt-1">
                Project activities will appear here
              </p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
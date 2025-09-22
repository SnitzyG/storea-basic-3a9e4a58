import React, { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useActivity } from '@/hooks/useActivity';
import { useTodos } from '@/hooks/useTodos';
import { useToast } from '@/hooks/use-toast';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { formatDistanceToNow, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  HelpCircle, 
  Briefcase, 
  FolderOpen,
  User,
  Clock,
  ExternalLink,
  Calendar,
  CheckSquare,
  MoreHorizontal,
  X
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const activityIcons = {
  project: FolderOpen,
  document: FileText,
  message: MessageSquare,
  rfi: HelpCircle,
  tender: Briefcase,
  user: User,
};

const actionColors = {
  created: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  updated: 'bg-blue-500/15 text-blue-700 border-blue-500/30',
  deleted: 'bg-red-500/15 text-red-700 border-red-500/30',
  assigned: 'bg-purple-500/15 text-purple-700 border-purple-500/30',
  completed: 'bg-slate-500/15 text-slate-700 border-slate-500/30',
  uploaded: 'bg-orange-500/15 text-orange-700 border-orange-500/30',
  submitted: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
};

const entityTypeColors = {
  project: 'bg-indigo-50 border-indigo-200',
  document: 'bg-blue-50 border-blue-200',
  message: 'bg-green-50 border-green-200',
  rfi: 'bg-orange-50 border-orange-200',
  tender: 'bg-purple-50 border-purple-200',
  user: 'bg-gray-50 border-gray-200',
};

export const RecentActivity = () => {
  const { activities, loading, dismissActivity, refetch } = useActivity();
  const { user } = useAuth();

  // Set up real-time updates for dashboard refresh
  useEffect(() => {
    if (!user) return;

    const activityChannel = supabase
      .channel('dashboard-activity-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_log',
        },
        (payload) => {
          console.log('Activity log change detected for dashboard:', payload);
          refetch();
        }
      )
      .subscribe();

    // Also listen for project membership changes that affect activity visibility
    const membershipChannel = supabase
      .channel('dashboard-membership-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_users',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Project membership change detected for dashboard:', payload);
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(membershipChannel);
    };
  }, [user?.id, refetch]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addTodo } = useTodos();

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

  const handleAddToCalendar = async (activity: any) => {
    try {
      const eventDate = addDays(new Date(), 1); // Default to tomorrow
      await addTodo(
        `Follow up: ${activity.description}`,
        'medium',
        eventDate.toISOString()
      );
      toast({
        title: "Added to Calendar",
        description: "Activity added as a calendar event for tomorrow",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to calendar",
        variant: "destructive",
      });
    }
  };

  const handleAddToTodo = async (activity: any) => {
    try {
      await addTodo(
        `Task: ${activity.description}`,
        'medium'
      );
      toast({
        title: "Added to To-Do",
        description: "Activity added to your to-do list",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to to-do list",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0 border-b">
          <CardTitle className="text-lg flex items-center gap-2 font-medium">
            <Clock className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <div className="text-center py-6 text-muted-foreground">
            Loading activities...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0 border-b">
        <CardTitle className="text-lg flex items-center gap-2 font-medium">
          <Clock className="h-5 w-5 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full">
          {activities.length > 0 ? (
            <div className="p-6 space-y-4">
              {activities.map((activity) => {
                const Icon = activityIcons[activity.entity_type as keyof typeof activityIcons] || User;
                return (
                  <div 
                    key={activity.id} 
                    className="group flex items-start gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleActivityClick(activity)}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.entity_type === 'project' ? 'bg-indigo-100 text-indigo-600' :
                        activity.entity_type === 'document' ? 'bg-blue-100 text-blue-600' :
                        activity.entity_type === 'message' ? 'bg-green-100 text-green-600' :
                        activity.entity_type === 'rfi' ? 'bg-orange-100 text-orange-600' :
                        activity.entity_type === 'tender' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {activity.user_profile?.name || 'Unknown User'}
                        </span>
                        <Badge 
                          className={`${actionColors[activity.action as keyof typeof actionColors] || actionColors.updated} text-xs`}
                          variant="outline"
                        >
                          {activity.action}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {activity.project?.name && (
                            <>
                              <span className="font-medium">{activity.project.name}</span>
                              <span>•</span>
                            </>
                          )}
                          {!activity.project_id && (
                            <>
                              <span className="font-medium">General</span>
                              <span>•</span>
                            </>
                          )}
                          <span>
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              dismissActivity(activity.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivityClick(activity);
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleAddToCalendar(activity)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Add to Calendar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleAddToTodo(activity)}>
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Add to To-Do
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
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
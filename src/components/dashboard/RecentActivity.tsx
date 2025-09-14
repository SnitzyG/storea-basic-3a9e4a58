import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useActivity } from '@/hooks/useActivity';
import { useTodos } from '@/hooks/useTodos';
import { useToast } from '@/hooks/use-toast';
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
  MoreHorizontal
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
  const { activities, loading } = useActivity();
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
                    className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 hover:shadow-md group ${
                      entityTypeColors[activity.entity_type as keyof typeof entityTypeColors] || entityTypeColors.user
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.entity_type === 'project' ? 'bg-indigo-100 text-indigo-600' :
                        activity.entity_type === 'document' ? 'bg-blue-100 text-blue-600' :
                        activity.entity_type === 'message' ? 'bg-green-100 text-green-600' :
                        activity.entity_type === 'rfi' ? 'bg-orange-100 text-orange-600' :
                        activity.entity_type === 'tender' ? 'bg-purple-100 text-purple-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-xs">
                            {activity.user_profile?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold text-sm">
                          {activity.user_profile?.name || 'Unknown User'}
                        </span>
                        <Badge 
                          className={`${actionColors[activity.action as keyof typeof actionColors] || actionColors.updated} font-medium`}
                          variant="outline"
                        >
                          {activity.action}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-foreground/90 mb-3 leading-relaxed">
                        {activity.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {activity.project?.name && (
                            <>
                              <span className="font-medium">{activity.project.name}</span>
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
                            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
                                className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
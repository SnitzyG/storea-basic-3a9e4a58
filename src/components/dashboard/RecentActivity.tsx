import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useActivity } from '@/hooks/useActivity';
import { useTodos } from '@/hooks/useTodos';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useToast } from '@/hooks/use-toast';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { formatDistanceToNow, addDays, addHours, format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
  X,
  Bell,
  CalendarDays,
  Filter
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';

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
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>('all');
  
  // Task dialog state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskDueDate, setTaskDueDate] = useState<Date | undefined>(new Date());
  const [taskReminder, setTaskReminder] = useState(false);
  const [taskReminderHours, setTaskReminderHours] = useState(1);

  // Calendar dialog state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [eventTime, setEventTime] = useState('09:00');
  const [eventDuration, setEventDuration] = useState(60); // minutes
  const [eventPriority, setEventPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [eventReminder, setEventReminder] = useState(false);
  const [eventReminderMinutes, setEventReminderMinutes] = useState(15);
  const [isMeeting, setIsMeeting] = useState(false);

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
  const { createEvent } = useCalendarEvents();
  const { selectedProject, availableProjects } = useProjectSelection();

  // Filter activities based on selected project
  const filteredActivities = selectedProjectFilter === 'all' 
    ? activities 
    : activities.filter(activity => activity.project_id === selectedProjectFilter);

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

  const openTaskDialog = (activity: any) => {
    setSelectedActivity(activity);
    setTaskTitle(`Task: ${activity.description}`);
    setTaskPriority('medium');
    setTaskDueDate(new Date());
    setTaskReminder(false);
    setTaskReminderHours(1);
    setIsTaskDialogOpen(true);
  };

  const openCalendarDialog = (activity: any) => {
    setSelectedActivity(activity);
    setEventTitle(`Follow up: ${activity.description}`);
    setEventDate(addDays(new Date(), 1)); // Default to tomorrow
    setEventTime('09:00');
    setEventDuration(60);
    setEventPriority('medium');
    setEventReminder(false);
    setEventReminderMinutes(15);
    setIsMeeting(false);
    setIsCalendarDialogOpen(true);
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim() || !selectedActivity) return;

    try {
      const dueDate = taskDueDate?.toISOString();
      await addTodo(taskTitle, taskPriority, dueDate);
      
      // TODO: Implement reminder functionality if taskReminder is true
      if (taskReminder) {
        // This would require a notification system or reminder service
        console.log(`Set reminder ${taskReminderHours} hours before task due date`);
      }
      
      toast({
        title: "Task Created",
        description: `"${taskTitle}" added to your task list`,
      });
      
      setIsTaskDialogOpen(false);
      resetTaskForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleCreateCalendarEvent = async () => {
    if (!eventTitle.trim() || !eventDate || !selectedActivity) return;

    try {
      const [hours, minutes] = eventTime.split(':').map(Number);
      const startDateTime = new Date(eventDate);
      startDateTime.setHours(hours, minutes, 0, 0);
      
      const endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + eventDuration);

      await createEvent({
        project_id: selectedActivity.project_id || selectedProject?.id,
        title: eventTitle,
        description: `Related to: ${selectedActivity.description}`,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        priority: eventPriority,
        is_meeting: isMeeting,
        status: 'scheduled',
      });

      // TODO: Implement reminder functionality if eventReminder is true
      if (eventReminder) {
        console.log(`Set reminder ${eventReminderMinutes} minutes before event`);
      }

      toast({
        title: "Event Created",
        description: `"${eventTitle}" added to your calendar`,
      });
      
      setIsCalendarDialogOpen(false);
      resetCalendarForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create calendar event",
        variant: "destructive",
      });
    }
  };

  const resetTaskForm = () => {
    setSelectedActivity(null);
    setTaskTitle('');
    setTaskPriority('medium');
    setTaskDueDate(new Date());
    setTaskReminder(false);
    setTaskReminderHours(1);
  };

  const resetCalendarForm = () => {
    setSelectedActivity(null);
    setEventTitle('');
    setEventDate(new Date());
    setEventTime('09:00');
    setEventDuration(60);
    setEventPriority('medium');
    setEventReminder(false);
    setEventReminderMinutes(15);
    setIsMeeting(false);
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 font-medium">
            <Clock className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Filter className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Filter by Project</Label>
                <Select value={selectedProjectFilter} onValueChange={setSelectedProjectFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[300px]">
          {filteredActivities.length > 0 ? (
            <div className="p-6 space-y-4">
              {filteredActivities.map((activity) => {
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
                      
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2 break-words overflow-hidden text-ellipsis">
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
                              <DropdownMenuItem onClick={() => openCalendarDialog(activity)}>
                                <Calendar className="h-4 w-4 mr-2" />
                                Add to Calendar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openTaskDialog(activity)}>
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Add to Tasks
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

      {/* Task Creation Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Create Task from Activity
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Task Title</Label>
              <Input
                id="task-title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Enter task title..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-priority">Priority</Label>
              <Select value={taskPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setTaskPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !taskDueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {taskDueDate ? format(taskDueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={taskDueDate}
                    onSelect={setTaskDueDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="task-reminder"
                checked={taskReminder}
                onCheckedChange={(checked) => setTaskReminder(checked as boolean)}
              />
              <Label htmlFor="task-reminder" className="text-sm">Set reminder</Label>
            </div>

            {taskReminder && (
              <div className="space-y-2 ml-6">
                <Label>Remind me (hours before due date)</Label>
                <Select value={taskReminderHours.toString()} onValueChange={(value) => setTaskReminderHours(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="8">8 hours</SelectItem>
                    <SelectItem value="24">1 day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreateTask} className="flex-1" disabled={!taskTitle.trim()}>
                <CheckSquare className="h-4 w-4 mr-2" />
                Create Task
              </Button>
              <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calendar Event Creation Dialog */}
      <Dialog open={isCalendarDialogOpen} onOpenChange={setIsCalendarDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Create Calendar Event from Activity
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="event-title">Event Title</Label>
              <Input
                id="event-title"
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Enter event title..."
              />
            </div>

            <div className="space-y-2">
              <Label>Event Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !eventDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={eventDate}
                    onSelect={setEventDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="event-time">Start Time</Label>
                <Input
                  id="event-time"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-duration">Duration (min)</Label>
                <Select value={eventDuration.toString()} onValueChange={(value) => setEventDuration(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="event-priority">Priority</Label>
              <Select value={eventPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setEventPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-meeting"
                checked={isMeeting}
                onCheckedChange={(checked) => setIsMeeting(checked as boolean)}
              />
              <Label htmlFor="is-meeting" className="text-sm">This is a meeting</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="event-reminder"
                checked={eventReminder}
                onCheckedChange={(checked) => setEventReminder(checked as boolean)}
              />
              <Label htmlFor="event-reminder" className="text-sm">Set reminder</Label>
            </div>

            {eventReminder && (
              <div className="space-y-2 ml-6">
                <Label>Remind me (minutes before event)</Label>
                <Select value={eventReminderMinutes.toString()} onValueChange={(value) => setEventReminderMinutes(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button onClick={handleCreateCalendarEvent} className="flex-1" disabled={!eventTitle.trim()}>
                <Calendar className="h-4 w-4 mr-2" />
                Create Event
              </Button>
              <Button variant="outline" onClick={() => setIsCalendarDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
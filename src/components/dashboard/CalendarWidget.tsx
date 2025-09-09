import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CalendarDays, Plus, Clock, CheckCircle2, ChevronLeft, ChevronRight, Download, Users, X, Pencil, Trash2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { useProjectSwitcher } from '@/hooks/useProjectSwitcher';
import { useProjects } from '@/hooks/useProjects';
import { useToast } from '@/hooks/use-toast';

export const CalendarWidget = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventPriority, setNewEventPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isMeeting, setIsMeeting] = useState(false);
  const [inviteCollaborators, setInviteCollaborators] = useState<string[]>([]);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [externalEmails, setExternalEmails] = useState<string[]>([]);
  const [externalEmail, setExternalEmail] = useState('');
  const [exportFormat, setExportFormat] = useState<'day' | 'week' | 'fortnight' | 'month'>('week');

  const { events, addEvent, updateEvent, deleteEvent, loading } = useCalendarEvents();
  const { currentProject } = useProjectSwitcher();
  const { getProjectUsers } = useProjects();
  const { toast } = useToast();

  const [projectUsers, setProjectUsers] = useState<any[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');

  React.useEffect(() => {
    if (currentProject) {
      getProjectUsers(currentProject).then(setProjectUsers);
    }
  }, [currentProject, getProjectUsers]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.start_datetime && isSameDay(new Date(event.start_datetime), date)
    );
  };

  const addCollaborator = () => {
    if (collaboratorEmail.trim() && !inviteCollaborators.includes(collaboratorEmail)) {
      setInviteCollaborators([...inviteCollaborators, collaboratorEmail]);
      setCollaboratorEmail('');
    }
  };

  const removeCollaborator = (email: string) => {
    setInviteCollaborators(inviteCollaborators.filter(e => e !== email));
  };

  const addExternalEmail = () => {
    if (externalEmail.trim() && !externalEmails.includes(externalEmail)) {
      setExternalEmails([...externalEmails, externalEmail]);
      setExternalEmail('');
    }
  };

  const removeExternalEmail = (email: string) => {
    setExternalEmails(externalEmails.filter(e => e !== email));
  };

  const handleAddEvent = async () => {
    if (newEventTitle.trim() && newEventDate && newEventTime) {
      try {
        const startDateTime = new Date(`${newEventDate}T${newEventTime}`).toISOString();
        
        await addEvent({
          project_id: currentProject || undefined,
          title: newEventTitle.trim(),
          description: newEventDescription.trim() || undefined,
          start_datetime: startDateTime,
          is_meeting: isMeeting,
          attendees: inviteCollaborators,
          external_attendees: externalEmails,
          priority: newEventPriority
        });
        
        // Reset form
        setNewEventTitle('');
        setNewEventDescription('');
        setNewEventDate('');
        setNewEventTime('');
        setNewEventPriority('medium');
        setIsMeeting(false);
        setInviteCollaborators([]);
        setExternalEmails([]);
        setIsDialogOpen(false);
      } catch (error) {
        console.error('Error adding event:', error);
      }
    }
  };

  const handleExportPDF = () => {
    // Filter events based on export format
    const now = new Date();
    let filteredEvents = events;

    switch (exportFormat) {
      case 'day':
        filteredEvents = events.filter(event => 
          isSameDay(new Date(event.start_datetime), now)
        );
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filteredEvents = events.filter(event => {
          const eventDate = new Date(event.start_datetime);
          return eventDate >= weekStart && eventDate <= weekEnd;
        });
        break;
      case 'fortnight':
        const fortnightStart = new Date(now);
        fortnightStart.setDate(now.getDate() - now.getDay());
        const fortnightEnd = new Date(fortnightStart);
        fortnightEnd.setDate(fortnightStart.getDate() + 13);
        filteredEvents = events.filter(event => {
          const eventDate = new Date(event.start_datetime);
          return eventDate >= fortnightStart && eventDate <= fortnightEnd;
        });
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        filteredEvents = events.filter(event => {
          const eventDate = new Date(event.start_datetime);
          return eventDate >= monthStart && eventDate <= monthEnd;
        });
        break;
    }

    // Create PDF content
    const content = `
<!DOCTYPE html>
<html>
<head>
    <title>Calendar Events - ${exportFormat}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .event { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .event-title { font-weight: bold; font-size: 16px; }
        .event-date { color: #666; }
        .event-description { margin-top: 5px; }
        .meeting-badge { background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
        .priority-high { border-left: 4px solid #f44336; }
        .priority-medium { border-left: 4px solid #ff9800; }
        .priority-low { border-left: 4px solid #4caf50; }
    </style>
</head>
<body>
    <h1>Calendar Events - ${exportFormat.charAt(0).toUpperCase() + exportFormat.slice(1)}</h1>
    <p>Generated on: ${format(now, 'PPPp')}</p>
    ${filteredEvents.map(event => `
        <div class="event priority-${event.priority}">
            <div class="event-title">${event.title}</div>
            <div class="event-date">${format(new Date(event.start_datetime), 'PPPp')}</div>
            ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
            ${event.is_meeting ? '<span class="meeting-badge">Meeting</span>' : ''}
        </div>
    `).join('')}
</body>
</html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-events-${exportFormat}-${format(now, 'yyyy-MM-dd')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Calendar exported",
      description: `Events for ${exportFormat} exported successfully`,
    });
    setIsExportDialogOpen(false);
  };

  const openEditEvent = (eventId: string) => {
    const ev = events.find(e => e.id === eventId);
    if (!ev) return;
    setEditingEventId(ev.id);
    setEditTitle(ev.title);
    setEditDescription(ev.description || '');
    const d = new Date(ev.start_datetime);
    setEditDate(d.toISOString().slice(0,10));
    setEditTime(d.toISOString().slice(11,16));
    setEditPriority((ev.priority as 'low'|'medium'|'high') || 'medium');
    setIsEditOpen(true);
  };

  const handleUpdateEvent = async () => {
    if (!editingEventId || !editDate || !editTime) return;
    const startDateTime = new Date(`${editDate}T${editTime}`).toISOString();
    await updateEvent(editingEventId, {
      title: editTitle.trim(),
      description: editDescription.trim() || null,
      start_datetime: startDateTime,
      priority: editPriority
    } as any);
    setIsEditOpen(false);
    setEditingEventId(null);
  };

  const todayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading calendar...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Download className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Export Calendar</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Export Period</Label>
                    <Select value={exportFormat} onValueChange={(value: 'day' | 'week' | 'fortnight' | 'month') => setExportFormat(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="fortnight">Fortnight</SelectItem>
                        <SelectItem value="month">Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleExportPDF} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="event-title">Title</Label>
                  <Input
                    id="event-title"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Event title"
                  />
                </div>

                <div>
                  <Label htmlFor="event-description">Description</Label>
                  <Textarea
                    id="event-description"
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    placeholder="Event description"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="event-date">Date</Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="event-time">Time</Label>
                    <Input
                      id="event-time"
                      type="time"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="event-priority">Priority</Label>
                  <Select value={newEventPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewEventPriority(value)}>
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
                  <Label htmlFor="is-meeting">This is a meeting</Label>
                </div>

                {isMeeting && (
                  <>
                    <Separator />
                    
                    <div>
                      <Label>Project Collaborators</Label>
                      <div className="flex gap-2 mt-1">
                        <Select value={collaboratorEmail} onValueChange={setCollaboratorEmail}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select collaborator" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectUsers.map((user) => (
                              <SelectItem key={user.user_id} value={user.user_id}>
                                {user.profiles?.name || 'Unknown User'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" onClick={addCollaborator} variant="outline" size="sm">
                          Add
                        </Button>
                      </div>
                      {inviteCollaborators.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {inviteCollaborators.map((userId) => {
                            const user = projectUsers.find(u => u.user_id === userId);
                            return (
                              <div key={userId} className="flex items-center justify-between bg-muted p-2 rounded">
                                <span className="text-sm">{user?.profiles?.name || 'Unknown User'}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeCollaborator(userId)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label>External Attendees</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={externalEmail}
                          onChange={(e) => setExternalEmail(e.target.value)}
                          placeholder="Enter email address"
                          onKeyPress={(e) => e.key === 'Enter' && addExternalEmail()}
                        />
                        <Button type="button" onClick={addExternalEmail} variant="outline" size="sm">
                          Add
                        </Button>
                      </div>
                      {externalEmails.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {externalEmails.map((email) => (
                            <div key={email} className="flex items-center justify-between bg-muted p-2 rounded">
                              <span className="text-sm">{email}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeExternalEmail(email)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="flex gap-2">
                  <Button onClick={handleAddEvent} className="flex-1">
                    Create Event
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {selectedDate && (
          <div className="space-y-2">
            <h4 className="font-medium">
              Events for {format(selectedDate, 'MMMM d, yyyy')}
            </h4>
            <ScrollArea className="h-32">
              {todayEvents.length > 0 ? (
                todayEvents.map((event) => (
                  <div key={event.id} className="p-2 border rounded-lg mb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{event.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.start_datetime), 'h:mm a')}
                          </div>
                          {event.is_meeting && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              Meeting
                            </Badge>
                          )}
                          <Badge 
                            variant={
                              event.priority === 'high' ? 'destructive' : 
                              event.priority === 'medium' ? 'default' : 'secondary'
                            } 
                            className="text-xs"
                          >
                            {event.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditEvent(event.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteEvent(event.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4 text-sm">
                  No events for this date
                </p>
              )}
            </ScrollArea>
          </div>
        )}
      </CardContent>
      {/* Edit Event Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-event-title">Title</Label>
              <Input id="edit-event-title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="edit-event-desc">Description</Label>
              <Textarea id="edit-event-desc" rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="edit-event-date">Date</Label>
                <Input id="edit-event-date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="edit-event-time">Time</Label>
                <Input id="edit-event-time" type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={editPriority} onValueChange={(v: 'low'|'medium'|'high') => setEditPriority(v)}>
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
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleUpdateEvent}>Save</Button>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
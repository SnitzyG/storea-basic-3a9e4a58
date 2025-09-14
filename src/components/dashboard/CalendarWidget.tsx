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
import { CalendarDays, Plus, Clock, CheckCircle2, ChevronLeft, ChevronRight, Download, Users, Paperclip, Edit, Trash2, X } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { useTodos } from '@/hooks/useTodos';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments';

export const CalendarWidget = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventPriority, setNewEventPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isMeeting, setIsMeeting] = useState(false);
  const [inviteCollaborators, setInviteCollaborators] = useState<string[]>([]);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [exportFormat, setExportFormat] = useState<'day' | 'week' | 'fortnight' | 'month'>('week');
  const [attachedDocument, setAttachedDocument] = useState<string>('');
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { todos, addTodo, updateTodo, deleteTodo } = useTodos();
  const { documents } = useDocuments();
  const { toast } = useToast();

  // Get todos for a specific date
  const getTodosForDate = (date: Date) => {
    return todos.filter(todo => 
      todo.due_date && isSameDay(new Date(todo.due_date), date)
    );
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(currentMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(currentMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
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

  const handleCreateEvent = async () => {
    if (!eventDate || !newEventTitle.trim()) return;

    try {
      let eventContent = isMeeting 
        ? `Meeting: ${newEventTitle}${newEventDescription ? ` - ${newEventDescription}` : ''}${inviteCollaborators.length > 0 ? ` (Attendees: ${inviteCollaborators.join(', ')})` : ''}`
        : `${newEventTitle}${newEventDescription ? ` - ${newEventDescription}` : ''}`;

      if (attachedDocument) {
        const doc = documents.find(d => d.id === attachedDocument);
        if (doc) {
          eventContent += ` [Document: ${doc.name}]`;
        }
      }

      const finalEventDate = newEventTime 
        ? new Date(`${eventDate.toDateString()} ${newEventTime}`)
        : eventDate;

      await addTodo(
        eventContent,
        newEventPriority,
        finalEventDate.toISOString()
      );
      
      // Reset form
      resetForm();
      
      toast({
        title: "Event created",
        description: `${isMeeting ? 'Meeting' : 'Event'} "${newEventTitle}" scheduled for ${format(eventDate, 'MMM d, yyyy')}`,
      });

      // Send confirmation for meetings
      if (isMeeting && inviteCollaborators.length > 0) {
        toast({
          title: "Meeting invitations sent",
          description: `Confirmation messages sent to ${inviteCollaborators.length} attendee(s)`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setNewEventTitle('');
    setNewEventDescription('');
    setNewEventTime('');
    setNewEventPriority('medium');
    setIsMeeting(false);
    setInviteCollaborators([]);
    setAttachedDocument('');
    setEventDate(selectedDate);
    setIsDialogOpen(false);
  };

  const handleEditEvent = (todo: any) => {
    setEditingEvent(todo);
    setNewEventTitle(todo.content.replace(/^Meeting: |^Task: /, '').split(' - ')[0]);
    setNewEventDescription(todo.content.includes(' - ') ? todo.content.split(' - ')[1] : '');
    setNewEventPriority(todo.priority || 'medium');
    setIsEditDialogOpen(true);
  };

  const handleUpdateEvent = async () => {
    if (!editingEvent || !newEventTitle.trim()) return;

    try {
      await updateTodo(editingEvent.id, {
        content: `${newEventTitle}${newEventDescription ? ` - ${newEventDescription}` : ''}`,
        priority: newEventPriority
      });
      
      setIsEditDialogOpen(false);
      setEditingEvent(null);
      resetForm();
      
      toast({
        title: "Event updated",
        description: "Event has been successfully updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = async (todoId: string) => {
    try {
      await deleteTodo(todoId);
      toast({
        title: "Event deleted",
        description: "Event has been successfully removed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    const eventsForPeriod = getTodosForDate(selectedDate || new Date());
    const dataStr = JSON.stringify(eventsForPeriod, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar-${exportFormat}-${format(selectedDate || new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: `Calendar exported for ${exportFormat}`,
    });
    setIsExportDialogOpen(false);
  };

  const selectedDateTodos = selectedDate ? getTodosForDate(selectedDate) : [];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 font-medium">
            <CalendarDays className="h-5 w-5 text-primary" />
            Calendar
          </CardTitle>
          <div className="flex items-center gap-1">
            <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Download className="h-4 w-4" />
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
                    <Button onClick={handleExport} className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Create New Event
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-title">Event Title</Label>
                      <Input
                        id="event-title"
                        value={newEventTitle}
                        onChange={(e) => setNewEventTitle(e.target.value)}
                        placeholder="Enter event title..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event-description">Description</Label>
                      <Textarea
                        id="event-description"
                        value={newEventDescription}
                        onChange={(e) => setNewEventDescription(e.target.value)}
                        placeholder="Add event description (optional)"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event-time">Time</Label>
                      <Input
                        id="event-time"
                        type="time"
                        value={newEventTime}
                        onChange={(e) => setNewEventTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event-priority">Priority</Label>
                      <Select value={newEventPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewEventPriority(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low Priority</SelectItem>
                          <SelectItem value="medium">Medium Priority</SelectItem>
                          <SelectItem value="high">High Priority</SelectItem>
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
                      <div className="space-y-3">
                        <Separator />
                        <div>
                          <Label>Invite Collaborators</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              value={collaboratorEmail}
                              onChange={(e) => setCollaboratorEmail(e.target.value)}
                              placeholder="Enter email address"
                              onKeyPress={(e) => e.key === 'Enter' && addCollaborator()}
                            />
                            <Button type="button" onClick={addCollaborator} variant="outline" size="sm">
                              Add
                            </Button>
                          </div>
                          {inviteCollaborators.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {inviteCollaborators.map((email) => (
                                <div key={email} className="flex items-center justify-between bg-muted p-2 rounded">
                                  <span className="text-sm">{email}</span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeCollaborator(email)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="event-date">Event Date</Label>
                      <Calendar
                        mode="single"
                        selected={eventDate}
                        onSelect={setEventDate}
                        className="rounded-md border"
                        initialFocus
                      />
                    </div>

                    {/* Document Attachment */}
                    <div className="space-y-2">
                      <Label htmlFor="attached-document">Attach Document (Optional)</Label>
                      <Select value={attachedDocument} onValueChange={setAttachedDocument}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a document..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No document</SelectItem>
                          {documents.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              <div className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                {doc.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleCreateEvent} className="flex-1 gap-2" disabled={!newEventTitle.trim() || !eventDate}>
                        <Plus className="h-4 w-4" />
                        Create {isMeeting ? 'Meeting' : 'Event'}
                      </Button>
                      <Button variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            {/* Edit Event Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5" />
                    Edit Event
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-event-title">Event Title</Label>
                    <Input
                      id="edit-event-title"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="Enter event title..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-event-description">Description</Label>
                    <Textarea
                      id="edit-event-description"
                      value={newEventDescription}
                      onChange={(e) => setNewEventDescription(e.target.value)}
                      placeholder="Add event description (optional)"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-event-priority">Priority</Label>
                    <Select value={newEventPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewEventPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="medium">Medium Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleUpdateEvent} className="flex-1" disabled={!newEventTitle.trim()}>
                      Update Event
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('prev')}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="text-base font-medium">
                {format(currentMonth, 'MMMM yyyy')}
              </h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigateMonth('next')}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="w-full h-full border rounded-lg"
              classNames={{
                months: "flex w-full flex-col space-y-4 flex-1",
                month: "space-y-4 w-full flex flex-col",
                caption: "flex justify-center pt-1 relative items-center",
                caption_label: "text-sm font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md transition-colors relative",
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground",
                day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              components={{
                Day: ({ date, displayMonth, ...props }: any) => {
                  if (!date) {
                    return (
                      <button {...props} className={`${props.className || ''} relative h-9 w-9`} />
                    );
                  }
                  const todosForDate = getTodosForDate(date);
                  
                  return (
                    <button
                      {...props}
                      className={`${props.className || ''} relative h-9 w-9 flex flex-col items-center justify-center`}
                    >
                      <span className="text-sm">{date.getDate()}</span>
                      {todosForDate.length > 0 && (
                        <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                          {todosForDate.slice(0, 3).map((_, index) => (
                            <div 
                              key={index} 
                              className="w-1 h-1 rounded-full bg-primary"
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                }
              }}
            />
          </div>

          {/* Events List for Selected Date */}
          {selectedDate && selectedDateTodos.length > 0 && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">
                  Events for {format(selectedDate, 'MMM d, yyyy')}
                </h4>
                <Badge variant="secondary" className="text-xs">
                  {selectedDateTodos.length} event{selectedDateTodos.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <ScrollArea className="max-h-32">
                <div className="space-y-2">
                  {selectedDateTodos.map((todo) => (
                    <div key={todo.id} className="flex items-center justify-between p-2 bg-background rounded border text-sm">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          todo.priority === 'high' ? 'bg-destructive' :
                          todo.priority === 'medium' ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`} />
                        <span className="font-medium text-sm">{todo.content.split(' - ')[0]}</span>
                        {todo.completed && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleEditEvent(todo)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => handleDeleteEvent(todo.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
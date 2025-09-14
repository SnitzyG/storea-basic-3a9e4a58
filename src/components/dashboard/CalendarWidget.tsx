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
    <Card className="h-full flex flex-col bg-gradient-to-br from-background to-muted/20 border-0 shadow-lg">
      <CardHeader className="pb-4 flex-shrink-0 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-3 font-semibold">
            <div className="p-2 bg-primary/10 rounded-full">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
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
                <Button variant="outline" size="sm" className="gap-2 hover:bg-primary/10 border-primary/20">
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
                    <Button onClick={handleUpdateEvent} className="flex-1 gap-2" disabled={!newEventTitle.trim()}>
                      <Edit className="h-4 w-4" />
                      Update Event
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditDialogOpen(false);
                      setEditingEvent(null);
                      resetForm();
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-6 p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl">
          <h3 className="font-bold text-xl text-foreground">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('prev')}
              className="hover:bg-primary/10 h-9 w-9 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigateMonth('next')}
              className="hover:bg-primary/10 h-9 w-9 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                setCurrentMonth(today);
                setSelectedDate(today);
              }}
              className="h-9"
            >
              Today
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 bg-card rounded-xl border border-border/40 p-4 shadow-sm">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="w-full rounded-lg pointer-events-auto"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4 w-full",
              caption: "hidden",
              caption_label: "hidden",
              nav: "hidden",
              nav_button: "hidden",
              nav_button_previous: "hidden",
              nav_button_next: "hidden",
              table: "w-full border-collapse",
              head_row: "flex mb-2",
              head_cell: "text-muted-foreground text-center font-medium text-sm w-full p-2 rounded-md bg-muted/20",
              row: "flex w-full",
              cell: "relative p-1 text-center text-sm focus-within:relative focus-within:z-20 flex-1",
              day: "h-10 w-full p-0 font-medium aria-selected:opacity-100 hover:bg-primary/10 hover:text-primary rounded-lg transition-all duration-200 cursor-pointer border border-transparent hover:border-primary/20",
              day_range_end: "day-range-end",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md border-primary",
              day_today: "bg-secondary/50 text-secondary-foreground font-bold ring-2 ring-primary/30",
              day_outside: "text-muted-foreground/40 opacity-50",
              day_disabled: "text-muted-foreground opacity-30 cursor-not-allowed hover:bg-transparent",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            components={{
              Day: ({ date, displayMonth, ...props }: any) => {
                if (!date) {
                  return (
                    <button {...props} className={`${props.className || ''} relative w-full h-full`} />
                  );
                }
                const todosForDate = getTodosForDate(date);
                
                return (
                  <div className="relative w-full h-full">
                    <button {...props} className={`${props.className || ''} relative w-full h-full flex flex-col items-center justify-center gap-1`}>
                      <span className="text-sm">{date.getDate()}</span>
                      {todosForDate.length > 0 && (
                        <div className="flex gap-0.5 absolute bottom-1">
                          {todosForDate.slice(0, 3).map((todo, index) => (
                            <div
                              key={index}
                              className={`h-1.5 w-1.5 rounded-full ${
                                todo.priority === 'high' 
                                  ? 'bg-red-500' 
                                  : todo.priority === 'medium' 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                              }`}
                            />
                          ))}
                          {todosForDate.length > 3 && (
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                          )}
                        </div>
                      )}
                    </button>
                  </div>
                );
              }
            }}
          />
        </div>

        {/* Selected Date Events */}
        {selectedDate && (
          <div className="space-y-3 flex-shrink-0 bg-muted/30 p-4 rounded-xl border border-border/20">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {format(selectedDate, 'EEEE, MMMM d')}
              </h4>
              <Badge variant="secondary" className="text-xs">
                {selectedDateTodos.length} event{selectedDateTodos.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {selectedDateTodos.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedDateTodos.map((todo) => (
                  <div 
                    key={todo.id} 
                    className="group flex items-center gap-3 p-3 bg-card rounded-lg border border-border/40 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className={`p-1.5 rounded-full ${
                      todo.priority === 'high' 
                        ? 'bg-red-100 text-red-600' 
                        : todo.priority === 'medium' 
                        ? 'bg-yellow-100 text-yellow-600' 
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {todo.completed ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Clock className="h-3 w-3" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${
                        todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                      }`}>
                        {todo.content}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs mt-1 ${
                          todo.priority === 'high' 
                            ? 'border-red-300 text-red-600' 
                            : todo.priority === 'medium' 
                            ? 'border-yellow-300 text-yellow-600' 
                            : 'border-green-300 text-green-600'
                        }`}
                      >
                        {todo.priority} priority
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleEditEvent(todo)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteEvent(todo.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No events scheduled</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Click "Add Event" to create your first event</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
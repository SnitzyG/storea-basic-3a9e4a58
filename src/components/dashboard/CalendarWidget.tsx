import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { ModernCalendar } from '@/components/ui/modern-calendar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarDays, Plus, Clock, CheckCircle2, ChevronLeft, ChevronRight, Download, Users, Paperclip, Edit, Trash2, X, FileText, CheckSquare } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addWeeks, subWeeks, getWeek, startOfYear } from 'date-fns';
import { useTodos } from '@/hooks/useTodos';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments';
import { useRFIs } from '@/hooks/useRFIs';
import { useMessages } from '@/hooks/useMessages';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import jsPDF from 'jspdf';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export const CalendarWidget = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isDayDetailsOpen, setIsDayDetailsOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const [newEventPriority, setNewEventPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isMeeting, setIsMeeting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'day' | 'week' | 'fortnight' | 'month'>('week');
  const [attachedDocument, setAttachedDocument] = useState<string>('');
  const [attachedRFI, setAttachedRFI] = useState<string>('');
  const [attachedMessage, setAttachedMessage] = useState<string>('');
  const [relatedType, setRelatedType] = useState<'document' | 'rfi' | 'message' | ''>('');
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // To-do list specific states
  const [newTodo, setNewTodo] = useState('');
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [attachToCalendar, setAttachToCalendar] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [todoRelatedInfo, setTodoRelatedInfo] = useState('');
  const [todoRelatedType, setTodoRelatedType] = useState<'document' | 'rfi' | 'message' | ''>('');
  
  const { selectedProject } = useProjectSelection();
  const { todos, addTodo, updateTodo, deleteTodo, toggleTodo, loading } = useTodos(selectedProject?.id);
  const { documents } = useDocuments(selectedProject?.id);
  const { rfis } = useRFIs();
  const { messages } = useMessages();
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

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    if (direction === 'prev') {
      newWeek.setDate(currentWeek.getDate() - 7);
    } else {
      newWeek.setDate(currentWeek.getDate() + 7);
    }
    setCurrentWeek(newWeek);
  };

  const getWeekLabel = (date: Date) => {
    const weekStart = startOfWeek(date);
    const weekEnd = endOfWeek(date);
    const weekNumber = getWeek(date);
    
    return {
      weekNumber,
      dateRange: `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`
    };
  };

  const handleDayDoubleClick = (date: Date) => {
    setSelectedDate(date);
    setIsDayDetailsOpen(true);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Header with enhanced styling
    doc.setFillColor(139, 69, 19); // Brown calendar theme
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Add title with white text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('📅 Calendar & Tasks Report', pageWidth / 2, 25, { align: 'center' });
    
    // Add project details if available
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    if (selectedProject) {
      doc.text(`Project: ${selectedProject.name}`, pageWidth / 2, 35, { align: 'center' });
    }
    
    // Reset text color and add date range
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const startDate = getDateRangeStart();
    const endDate = getDateRangeEnd();
    doc.text(`Period: ${format(startDate, 'PPP')} - ${format(endDate, 'PPP')}`, pageWidth / 2, 55, { align: 'center' });
    
    // Add generation timestamp
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${format(new Date(), 'PPP p')}`, pageWidth / 2, 62, { align: 'center' });
    
    // Get events in date range
    const eventsInRange = todos.filter(todo => {
      if (!todo.due_date) return false;
      const todoDate = new Date(todo.due_date);
      return todoDate >= startDate && todoDate <= endDate;
    });
    
    // Add summary box
    let yPosition = 75;
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, yPosition, pageWidth - 30, 25, 2, 2, 'FD');
    
    const pendingCount = eventsInRange.filter(todo => !todo.completed).length;
    const completedCount = eventsInRange.filter(todo => todo.completed).length;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 20, yPosition + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Tasks: ${eventsInRange.length} | Pending: ${pendingCount} | Completed: ${completedCount}`, 20, yPosition + 18);
    
    yPosition += 40;
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by STOREAlite', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    const filename = selectedProject 
      ? `${selectedProject.name}-calendar-tasks-${exportFormat}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      : `calendar-tasks-${exportFormat}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    
    doc.save(filename);
    
    toast({
      title: "Success",
      description: `Calendar & Tasks exported as PDF for ${exportFormat}`,
    });
    setIsExportDialogOpen(false);
  };

  const getDateRangeStart = () => {
    if (!selectedDate) return new Date();
    
    switch (exportFormat) {
      case 'day':
        return selectedDate;
      case 'week':
        return startOfWeek(selectedDate);
      case 'fortnight':
        return startOfWeek(selectedDate);
      case 'month':
        return startOfMonth(selectedDate);
      default:
        return selectedDate;
    }
  };

  const getDateRangeEnd = () => {
    if (!selectedDate) return new Date();
    
    switch (exportFormat) {
      case 'day':
        return selectedDate;
      case 'week':
        return endOfWeek(selectedDate);
      case 'fortnight':
        return endOfWeek(addWeeks(selectedDate, 1));
      case 'month':
        return endOfMonth(selectedDate);
      default:
        return selectedDate;
    }
  };

  const handleCreateEvent = async () => {
    if (!eventDate || !newEventTitle.trim()) return;

    try {
      let eventContent = isMeeting 
        ? `Meeting: ${newEventTitle}${newEventDescription ? ` - ${newEventDescription}` : ''}`
        : `${newEventTitle}${newEventDescription ? ` - ${newEventDescription}` : ''}`;

      // Add related information based on type
      if (relatedType === 'document' && attachedDocument) {
        const doc = documents.find(d => d.id === attachedDocument);
        if (doc) {
          eventContent += ` [Document: ${doc.name}]`;
        }
      } else if (relatedType === 'rfi' && attachedRFI) {
        const rfi = rfis.find(r => r.id === attachedRFI);
        if (rfi) {
          eventContent += ` [RFI: ${rfi.rfi_number || rfi.subject || 'Untitled'}]`;
        }
      } else if (relatedType === 'message' && attachedMessage) {
        const message = messages.find(m => m.id === attachedMessage);
        if (message) {
          eventContent += ` [Message: ${message.content.substring(0, 50)}...]`;
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
    setAttachedDocument('');
    setAttachedRFI('');
    setAttachedMessage('');
    setRelatedType('');
    setEventDate(selectedDate);
    setIsDialogOpen(false);
  };

  // Helper functions for to-do list
  const handleAddTodo = async () => {
    if (newTodo.trim()) {
      try {
        let todoContent = newTodo.trim();
        
        if (todoRelatedInfo && todoRelatedType) {
          todoContent += ` [${todoRelatedType.toUpperCase()}: ${todoRelatedInfo}]`;
        }

        const dueDateTime = attachToCalendar && dueDate ? new Date(dueDate).toISOString() : undefined;
        
        await addTodo(todoContent, newEventPriority, dueDateTime);
        
        // Reset form
        setNewTodo('');
        setNewEventPriority('medium');
        setAttachToCalendar(false);
        setDueDate('');
        setTodoRelatedInfo('');
        setTodoRelatedType('');
        setTodoDialogOpen(false);
        
        toast({
          title: "Success",
          description: "Task added successfully!",
        });
      } catch (error) {
        console.error('Error adding todo:', error);
        toast({
          title: "Error",
          description: "Failed to add task.",
          variant: "destructive",
        });
      }
    }
  };

  const handleQuickAdd = async () => {
    if (newTodo.trim()) {
      try {
        await addTodo(newTodo.trim(), newEventPriority);
        setNewTodo('');
        setNewEventPriority('medium');
        toast({
          title: "Success",
          description: "Task added successfully!",
        });
      } catch (error) {
        console.error('Error adding todo:', error);
        toast({
          title: "Error",
          description: "Failed to add task.",
          variant: "destructive",
        });
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleQuickAdd();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const pendingTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  const handleExport = () => {
    generatePDF();
  };

  const selectedDateTodos = selectedDate ? getTodosForDate(selectedDate) : [];

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2 flex-shrink-0 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-base flex items-center gap-2 font-medium">
                <CalendarDays className="h-4 w-4 text-primary" />
                Calendar & Tasks
              </CardTitle>
            </div>
            <div className="flex items-center gap-1">
              <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <Download className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Export Calendar & Tasks</DialogTitle>
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
                        <FileText className="h-4 w-4 mr-2" />
                        Export PDF
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
                  <Button variant="outline" size="sm" className="gap-1 text-xs px-2 py-1 h-7">
                    <Plus className="h-3 w-3" />
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

                      <div className="flex gap-2 pt-4">
                        <Button onClick={handleCreateEvent} className="flex-1">
                          Create Event
                        </Button>
                        <Button variant="outline" onClick={resetForm}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-auto p-4 min-h-0">
          <Tabs defaultValue="calendar" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Tasks
                <Badge variant="secondary" className="ml-1">
                  {pendingTodos.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="calendar" className="flex-1 mt-0">
              <div className="h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Label htmlFor="view-mode" className="text-xs text-muted-foreground">
                    Week
                  </Label>
                  <Switch
                    id="view-mode"
                    checked={viewMode === 'month'}
                    onCheckedChange={(checked) => setViewMode(checked ? 'month' : 'week')}
                  />
                  <Label htmlFor="view-mode" className="text-xs text-muted-foreground">
                    Month
                  </Label>
                </div>
                
                {viewMode === 'month' ? (
                  <div className="flex flex-col h-full gap-4">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth('prev')}
                        className="p-1 h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h3 className="text-sm font-medium">
                        {format(currentMonth, 'MMMM yyyy')}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateMonth('next')}
                        className="p-1 h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 min-h-0">
                      <ModernCalendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        initialFocus
                        className="w-full h-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full gap-4">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateWeek('prev')}
                        className="p-1 h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-center">
                        <h3 className="text-sm font-medium">
                          Week {getWeekLabel(currentWeek).weekNumber}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {getWeekLabel(currentWeek).dateRange}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigateWeek('next')}
                        className="p-1 h-8 w-8"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 min-h-0 overflow-auto grid grid-cols-7 gap-1 text-xs">
                      {/* Day headers */}
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-center font-medium text-muted-foreground border-b">
                          {day}
                        </div>
                      ))}
                      
                      {/* Week days */}
                      {eachDayOfInterval({
                        start: startOfWeek(currentWeek),
                        end: endOfWeek(currentWeek)
                      }).map((date) => {
                        const dayTodos = getTodosForDate(date);
                        const isToday = isSameDay(date, new Date());
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        
                        return (
                          <div
                            key={date.toISOString()}
                            className={cn(
                              "p-2 border rounded-sm cursor-pointer hover:bg-muted/50 transition-colors",
                              isToday && "bg-primary text-primary-foreground",
                              isSelected && !isToday && "bg-muted border-primary",
                              dayTodos.length > 0 && "border-l-4 border-l-blue-500"
                            )}
                            onClick={() => setSelectedDate(date)}
                            onDoubleClick={() => handleDayDoubleClick(date)}
                          >
                            <div className="font-medium">{format(date, 'd')}</div>
                            {dayTodos.length > 0 && (
                              <div className="text-[10px] text-muted-foreground">
                                {dayTodos.length} event{dayTodos.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="tasks" className="flex-1 mt-0">
              <div className="h-full flex flex-col space-y-4 overflow-hidden">
                {/* Quick add section */}
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Quick add task..."
                      value={newTodo}
                      onChange={(e) => setNewTodo(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                  </div>
                  <Select value={newEventPriority} onValueChange={(value: 'low' | 'medium' | 'high') => setNewEventPriority(value)}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Med</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleQuickAdd} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Advanced add dialog */}
                <Dialog open={todoDialogOpen} onOpenChange={setTodoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full gap-2">
                      <Plus className="h-4 w-4" />
                      Add Detailed Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        Create Detailed Task
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] pr-4">
                      <div className="space-y-4 pt-4">
                        <div>
                          <Label htmlFor="task-content">Task</Label>
                          <Textarea
                            id="task-content"
                            value={newTodo}
                            onChange={(e) => setNewTodo(e.target.value)}
                            placeholder="Enter task description"
                            rows={3}
                          />
                        </div>

                        <div>
                          <Label htmlFor="task-priority">Priority</Label>
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
                            id="attach-calendar"
                            checked={attachToCalendar}
                            onCheckedChange={(checked) => setAttachToCalendar(checked as boolean)}
                          />
                          <Label htmlFor="attach-calendar">Attach to Calendar</Label>
                        </div>

                        {attachToCalendar && (
                          <div>
                            <Label htmlFor="due-date">Due Date & Time</Label>
                            <Input
                              id="due-date"
                              type="datetime-local"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                            />
                          </div>
                        )}

                        <div>
                          <Label>Related Information (Optional)</Label>
                          <Select value={todoRelatedType} onValueChange={(value: 'document' | 'rfi' | 'message' | '') => setTodoRelatedType(value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              <SelectItem value="document">Document</SelectItem>
                              <SelectItem value="rfi">RFI</SelectItem>
                              <SelectItem value="message">Message</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {todoRelatedType && (
                          <div>
                            <Label>Related Item</Label>
                            {todoRelatedType === 'document' && (
                              <Select value={todoRelatedInfo} onValueChange={setTodoRelatedInfo}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select document" />
                                </SelectTrigger>
                                <SelectContent>
                                  {documents.map((doc) => (
                                    <SelectItem key={doc.id} value={doc.name}>
                                      {doc.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {todoRelatedType === 'rfi' && (
                              <Select value={todoRelatedInfo} onValueChange={setTodoRelatedInfo}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select RFI" />
                                </SelectTrigger>
                                <SelectContent>
                                  {rfis.map((rfi) => (
                                    <SelectItem key={rfi.id} value={rfi.rfi_number || rfi.subject || 'Untitled'}>
                                      {rfi.rfi_number || rfi.subject || 'Untitled'}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            {todoRelatedType === 'message' && (
                              <Select value={todoRelatedInfo} onValueChange={setTodoRelatedInfo}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select message" />
                                </SelectTrigger>
                                <SelectContent>
                                  {messages.map((message) => (
                                    <SelectItem key={message.id} value={message.content.substring(0, 50)}>
                                      {message.content.substring(0, 50)}...
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 pt-4">
                          <Button onClick={handleAddTodo} className="flex-1">
                            Add Task
                          </Button>
                          <Button variant="outline" onClick={() => setTodoDialogOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                {/* Tasks display */}
                <div className="flex-1 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pr-2">
                    {loading ? (
                      <p className="text-muted-foreground text-center">Loading tasks...</p>
                    ) : (
                      <>
                        {/* Pending tasks */}
                        {pendingTodos.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-3">
                              Pending Tasks ({pendingTodos.length})
                            </h4>
                            <div className="space-y-2">
                              {pendingTodos.map((todo) => (
                                <div key={todo.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                  <Checkbox
                                    checked={todo.completed}
                                    onCheckedChange={() => toggleTodo(todo.id)}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm">{todo.content}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant={getPriorityColor(todo.priority)} className="text-xs">
                                        {todo.priority}
                                      </Badge>
                                      {todo.due_date && (
                                        <span className="text-xs text-muted-foreground">
                                          Due: {format(new Date(todo.due_date), 'MMM d, yyyy h:mm a')}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteTodo(todo.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Completed tasks */}
                        {completedTodos.length > 0 && (
                          <div>
                            <Separator />
                            <h4 className="text-sm font-medium text-muted-foreground mb-3 mt-4">
                              Completed Tasks ({completedTodos.length})
                            </h4>
                            <div className="space-y-2">
                              {completedTodos.map((todo) => (
                                <div key={todo.id} className="flex items-start gap-3 p-3 border rounded-lg bg-muted/30">
                                  <Checkbox
                                    checked={todo.completed}
                                    onCheckedChange={() => toggleTodo(todo.id)}
                                    className="mt-0.5"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-muted-foreground line-through">{todo.content}</p>
                                    {todo.due_date && (
                                      <span className="text-xs text-muted-foreground">
                                        Completed: {format(new Date(todo.due_date), 'MMM d, yyyy')}
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteTodo(todo.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {todos.length === 0 && (
                          <div className="text-center py-8">
                            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                            <p className="text-muted-foreground text-sm">
                              Add your first task to get started!
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
};
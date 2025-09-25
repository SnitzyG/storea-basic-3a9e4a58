import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { CalendarDays, Plus, Clock, CheckCircle2, ChevronLeft, ChevronRight, Download, Users, Paperclip, Edit, Trash2, X, FileText } from 'lucide-react';
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
  const { selectedProject } = useProjectSelection();
  const { todos, addTodo, updateTodo, deleteTodo } = useTodos(selectedProject?.id);
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
    doc.text('📅 Calendar Events Report', pageWidth / 2, 25, { align: 'center' });
    
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
    
    const meetingCount = eventsInRange.filter(todo => todo.content.includes('Meeting:')).length;
    const eventCount = eventsInRange.length - meetingCount;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 20, yPosition + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Events: ${eventsInRange.length} | Meetings: ${meetingCount} | Other Events: ${eventCount}`, 20, yPosition + 18);
    
    yPosition += 40;
    
    // Group events by date
    const eventsByDate = new Map();
    eventsInRange.forEach(todo => {
      const dateKey = format(new Date(todo.due_date!), 'yyyy-MM-dd');
      if (!eventsByDate.has(dateKey)) {
        eventsByDate.set(dateKey, []);
      }
      eventsByDate.get(dateKey).push(todo);
    });
    
    // Sort dates
    const sortedDates = Array.from(eventsByDate.keys()).sort();
    
    if (sortedDates.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 69, 19);
      doc.text('📋 Events by Date', 20, yPosition);
      yPosition += 20;
      
      sortedDates.forEach(dateKey => {
        const dayEvents = eventsByDate.get(dateKey);
        
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = 30;
        }
        
        // Date header
        doc.setDrawColor(139, 69, 19);
        doc.setFillColor(245, 245, 220);
        doc.roundedRect(15, yPosition - 8, pageWidth - 30, 18, 2, 2, 'FD');
        
        doc.setTextColor(139, 69, 19);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        const dateObj = new Date(dateKey);
        doc.text(`📅 ${format(dateObj, 'EEEE, MMMM d, yyyy')}`, 20, yPosition + 2);
        yPosition += 25;
        
        dayEvents.forEach((todo, index) => {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 30;
          }
          
          // Event box
          const isMeeting = todo.content.includes('Meeting:');
          doc.setDrawColor(isMeeting ? 34 : 59, isMeeting ? 197 : 130, isMeeting ? 94 : 246);
          doc.setFillColor(isMeeting ? 240 : 239, isMeeting ? 253 : 246, isMeeting ? 244 : 255);
          doc.roundedRect(20, yPosition - 5, pageWidth - 40, 25, 1, 1, 'FD');
          
          // Event icon and title
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          const eventIcon = isMeeting ? '🤝' : '📌';
          const eventTime = todo.due_date ? format(new Date(todo.due_date), 'h:mm a') : 'All Day';
          doc.text(`${eventIcon} ${eventTime}`, 25, yPosition + 5);
          
          // Event content
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          const contentLines = doc.splitTextToSize(todo.content, pageWidth - 70);
          doc.text(contentLines, 25, yPosition + 12);
          
          // Priority indicator
          if (todo.priority && todo.priority !== 'medium') {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            const priorityColor = todo.priority === 'high' ? '🔴' : '🟡';
            doc.text(`${priorityColor} ${todo.priority.toUpperCase()} PRIORITY`, 25, yPosition + 20);
          }
          
          yPosition += 35;
        });
        
        yPosition += 10;
      });
    } else {
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text('📅 No events found in this date range', pageWidth / 2, yPosition, { align: 'center' });
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by STOREAlite', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    const filename = selectedProject 
      ? `${selectedProject.name}-calendar-${exportFormat}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      : `calendar-${exportFormat}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    
    doc.save(filename);
    
    toast({
      title: "Success",
      description: `Calendar exported as PDF for ${exportFormat}`,
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
                Calendar
              </CardTitle>
              <div className="flex items-center gap-2">
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

                      <div className="space-y-2">
                        <Label htmlFor="event-date">Event Date</Label>
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
                            <Calendar
                              mode="single"
                              selected={eventDate}
                              onSelect={setEventDate}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                              classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                month: "space-y-4",
                                caption: "flex justify-center pt-1 relative items-center",
                                caption_label: "text-sm font-medium",
                                nav: "space-x-1 flex items-center",
                                nav_button: cn(
                                  buttonVariants({ variant: "outline", size: "icon" }),
                                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
                                ),
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex",
                                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                row: "flex w-full mt-2",
                                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: cn(
                                  buttonVariants({ variant: "ghost" }),
                                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 transition-colors rounded-sm"
                                ),
                                day_range_end: "day-range-end",
                                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                day_today: "bg-accent text-accent-foreground font-semibold",
                                day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                                day_disabled: "text-muted-foreground opacity-50",
                                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                day_hidden: "invisible",
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Related Information</Label>
                        <div className="space-y-2">
                          <Select
                            value={relatedType === '' ? 'none' : relatedType}
                            onValueChange={(value: 'document' | 'rfi' | 'message' | 'none') =>
                              setRelatedType(value === 'none' ? '' : (value as 'document' | 'rfi' | 'message'))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              <SelectItem value="document">Document</SelectItem>
                              <SelectItem value="rfi">RFI</SelectItem>
                              <SelectItem value="message">Message</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {relatedType === 'document' && (
                            <Select
                              value={attachedDocument === '' ? 'none' : attachedDocument}
                              onValueChange={(v) => setAttachedDocument(v === 'none' ? '' : v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a document..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No document</SelectItem>
                                {documents.length > 0 ? (
                                  documents.map((doc) => (
                                    <SelectItem key={doc.id} value={doc.id}>
                                      <div className="flex items-center gap-2">
                                        <Paperclip className="h-4 w-4" />
                                        {doc.name || 'Untitled Document'}
                                      </div>
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-documents" disabled>No documents available</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          )}

                          {relatedType === 'rfi' && (
                            <Select
                              value={attachedRFI === '' ? 'none' : attachedRFI}
                              onValueChange={(v) => setAttachedRFI(v === 'none' ? '' : v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an RFI..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No RFI</SelectItem>
                                {rfis.map((rfi) => (
                                  <SelectItem key={rfi.id} value={rfi.id}>
                                    {rfi.rfi_number || rfi.subject || 'Untitled RFI'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {relatedType === 'message' && (
                            <Select
                              value={attachedMessage === '' ? 'none' : attachedMessage}
                              onValueChange={(v) => setAttachedMessage(v === 'none' ? '' : v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a message..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No message</SelectItem>
                                {messages.length > 0 ? (
                                  messages.map((message) => (
                                    <SelectItem key={message.id} value={message.id}>
                                      {(message.content?.substring(0, 50) || 'Empty message') + (message.content && message.content.length > 50 ? '...' : '')}
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-messages" disabled>No messages available</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
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

        <CardContent className="flex-1 p-3 overflow-hidden">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => viewMode === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <div className="text-center">
                  {viewMode === 'month' ? (
                    <h3 className="text-sm font-medium">
                      {format(currentMonth, 'MMMM yyyy')}
                    </h3>
                  ) : (
                    <div className="text-sm">
                      <div className="font-medium">
                        Week {getWeekLabel(currentWeek).weekNumber}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getWeekLabel(currentWeek).dateRange}
                      </div>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => viewMode === 'month' ? navigateMonth('next') : navigateWeek('next')}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col border rounded-lg">
                {/* Days of week header */}
                <div className="grid grid-cols-7 gap-px bg-border p-1 rounded-t-lg">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="h-6 flex items-center justify-center text-xs font-medium text-muted-foreground bg-background">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar dates grid */}
                <div className="flex-1 p-1 bg-background rounded-b-lg">
                  {viewMode === 'month' ? (
                    (() => {
                      const start = startOfMonth(currentMonth);
                      const end = endOfMonth(currentMonth);
                      const startDate = new Date(start);
                      startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
                      
                      const endDate = new Date(end);
                      endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday
                      
                      const days = eachDayOfInterval({ start: startDate, end: endDate });
                      
                      return (
                        <div className="grid grid-cols-7 grid-rows-6 gap-px h-full">
                          {days.map((date) => {
                            const todosForDate = getTodosForDate(date);
                            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                            const isSelected = selectedDate && isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, new Date());
                            
                            return (
                              <button
                                key={date.toISOString()}
                                onClick={() => setSelectedDate(date)}
                                onDoubleClick={() => handleDayDoubleClick(date)}
                                className={`
                                  w-full h-full flex flex-col items-center justify-start pt-0.5 relative
                                  transition-colors rounded-sm text-xs
                                  ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground opacity-50'}
                                  ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent hover:text-accent-foreground'}
                                  ${isToday && !isSelected ? 'bg-accent text-accent-foreground font-semibold' : ''}
                                `}
                              >
                                <span className="text-xs">{date.getDate()}</span>
                                {todosForDate.length > 0 && (
                                  <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                                    {todosForDate.slice(0, 3).map((_, index) => (
                                      <div 
                                        key={index} 
                                        className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`}
                                      />
                                    ))}
                                    {todosForDate.length > 3 && (
                                      <div className={`w-1.5 h-1.5 rounded-full opacity-60 ${isSelected ? 'bg-primary-foreground' : 'bg-primary'}`} />
                                    )}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()
                  ) : (
                    (() => {
                      const weekStart = startOfWeek(currentWeek);
                      const weekEnd = endOfWeek(currentWeek);
                      const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
                      
                      return (
                        <div className="grid grid-cols-7 gap-px h-full">
                          {days.map((date) => {
                            const todosForDate = getTodosForDate(date);
                            const isSelected = selectedDate && isSameDay(date, selectedDate);
                            const isToday = isSameDay(date, new Date());
                            
                            return (
                              <button
                                key={date.toISOString()}
                                onClick={() => setSelectedDate(date)}
                                onDoubleClick={() => handleDayDoubleClick(date)}
                                className={`
                                  w-full h-full flex flex-col p-2 relative
                                  transition-colors rounded-sm border
                                  ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent hover:text-accent-foreground border-border'}
                                  ${isToday && !isSelected ? 'bg-accent text-accent-foreground font-semibold border-accent' : ''}
                                `}
                              >
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="text-sm font-medium">{format(date, 'EEE')}</span>
                                  <span className="text-lg font-bold">{date.getDate()}</span>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                  {todosForDate.slice(0, 3).map((todo, index) => (
                                    <div 
                                      key={index}
                                      className={`text-xs p-1 mb-1 rounded truncate ${
                                        isSelected 
                                          ? 'bg-primary-foreground/20 text-primary-foreground' 
                                          : todo.priority === 'high' 
                                            ? 'bg-destructive/10 text-destructive' 
                                            : todo.priority === 'medium'
                                              ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                                              : 'bg-green-500/10 text-green-700 dark:text-green-400'
                                      }`}
                                    >
                                      {todo.content.split(' - ')[0].substring(0, 20)}
                                      {todo.content.length > 20 && '...'}
                                    </div>
                                  ))}
                                  {todosForDate.length > 3 && (
                                    <div className={`text-xs opacity-60 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                                      +{todosForDate.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
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

      {/* Day Details Dialog */}
      <Dialog open={isDayDetailsOpen} onOpenChange={setIsDayDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Events for {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 pt-4">
              {selectedDate && selectedDateTodos.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-sm">
                      {selectedDateTodos.length} event{selectedDateTodos.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {selectedDateTodos.map((todo) => {
                      const isMeeting = todo.content.includes('Meeting:');
                      const eventTime = todo.due_date ? format(new Date(todo.due_date), 'h:mm a') : 'All Day';
                      
                      return (
                        <div key={todo.id} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                todo.priority === 'high' ? 'bg-destructive' :
                                todo.priority === 'medium' ? 'bg-yellow-500' : 
                                'bg-green-500'
                              }`} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-sm">
                                    {isMeeting ? '🤝' : '📌'} {todo.content.split(' - ')[0].replace('Meeting: ', '')}
                                  </h4>
                                  {todo.completed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                                </div>
                                {todo.content.includes(' - ') && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {todo.content.split(' - ').slice(1).join(' - ')}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {eventTime}
                                  </span>
                                  <span className="capitalize">
                                    {todo.priority} priority
                                  </span>
                                  {isMeeting && (
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      Meeting
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setIsDayDetailsOpen(false);
                                  handleEditEvent(todo);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => handleDeleteEvent(todo.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No events scheduled</h3>
                  <p className="text-muted-foreground mb-4">
                    No events, tasks, or deadlines for {selectedDate && format(selectedDate, 'MMMM d, yyyy')}
                  </p>
                  <Button 
                    onClick={() => {
                      setIsDayDetailsOpen(false);
                      setEventDate(selectedDate);
                      setIsDialogOpen(true);
                    }}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Event
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="outline"
              onClick={() => {
                setIsDayDetailsOpen(false);
                setEventDate(selectedDate);
                setIsDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
            <Button variant="outline" onClick={() => setIsDayDetailsOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
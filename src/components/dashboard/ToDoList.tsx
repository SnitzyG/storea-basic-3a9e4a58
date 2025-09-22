import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { CheckSquare, Trash2, Plus, Calendar, FileText, MessageSquare, HelpCircle, Users, Download } from 'lucide-react';
import { useTodos, Todo } from '@/hooks/useTodos';
import { useToast } from '@/hooks/use-toast';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks } from 'date-fns';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import jsPDF from 'jspdf';
import { useDocuments } from '@/hooks/useDocuments';
import { useRFIs } from '@/hooks/useRFIs';
import { useMessages } from '@/hooks/useMessages';

export const ToDoList = () => {
  const [newTodo, setNewTodo] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [attachToCalendar, setAttachToCalendar] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [relatedInfo, setRelatedInfo] = useState('');
  const [relatedType, setRelatedType] = useState<'document' | 'rfi' | 'message' | ''>('');
  const [exportFormat, setExportFormat] = useState<'day' | 'week' | 'fortnight' | 'month'>('week');
  const { selectedProject } = useProjectSelection();
  const { todos, addTodo: createTodo, toggleTodo, deleteTodo, loading } = useTodos(selectedProject?.id);
  const { documents } = useDocuments(selectedProject?.id);
  const { rfis } = useRFIs();
  const { messages } = useMessages();
  const { toast } = useToast();

  const getDateRangeStart = () => {
    const today = new Date();
    
    switch (exportFormat) {
      case 'day':
        return today;
      case 'week':
        return startOfWeek(today);
      case 'fortnight':
        return startOfWeek(today);
      case 'month':
        return startOfMonth(today);
      default:
        return today;
    }
  };

  const getDateRangeEnd = () => {
    const today = new Date();
    
    switch (exportFormat) {
      case 'day':
        return today;
      case 'week':
        return endOfWeek(today);
      case 'fortnight':
        return endOfWeek(addWeeks(today, 1));
      case 'month':
        return endOfMonth(today);
      default:
        return today;
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Header with enhanced styling
    doc.setFillColor(59, 130, 246); // Blue background
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Add title with white text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('To-Do List Report', pageWidth / 2, 25, { align: 'center' });
    
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
    
    // Filter todos in date range
    const todosInRange = todos.filter(todo => {
      if (!todo.due_date) return exportFormat === 'day';
      const todoDate = new Date(todo.due_date);
      return todoDate >= startDate && todoDate <= endDate;
    });
    
    // Add summary box
    let yPosition = 75;
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, yPosition, pageWidth - 30, 25, 2, 2, 'FD');
    
    const pendingCount = todosInRange.filter(todo => !todo.completed).length;
    const completedCount = todosInRange.filter(todo => todo.completed).length;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary:', 20, yPosition + 8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Tasks: ${todosInRange.length} | Pending: ${pendingCount} | Completed: ${completedCount}`, 20, yPosition + 18);
    
    yPosition += 40;
    
    // Add pending todos
    const pendingTodos = todosInRange.filter(todo => !todo.completed);
    
    if (pendingTodos.length > 0) {
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(220, 38, 38); // Red color for pending
      doc.text('📋 Pending Tasks', 20, yPosition);
      yPosition += 15;
      
      pendingTodos.forEach((todo, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 30;
        }
        
        // Task box
        doc.setDrawColor(220, 38, 38);
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(15, yPosition - 5, pageWidth - 30, 20, 1, 1, 'FD');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ☐ ${todo.content}`, 20, yPosition + 5);
        yPosition += 12;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        
        const details = [];
        if (todo.due_date) {
          details.push(`Due: ${format(new Date(todo.due_date), 'PPP p')}`);
        }
        if (todo.priority !== 'medium') {
          const priorityColor = todo.priority === 'high' ? '🔴' : '🟡';
          details.push(`${priorityColor} Priority: ${todo.priority.toUpperCase()}`);
        }
        
        if (details.length > 0) {
          doc.text(details.join(' | '), 25, yPosition + 5);
          yPosition += 8;
        }
        yPosition += 10;
      });
    }
    
    // Add completed todos
    const completedTodos = todosInRange.filter(todo => todo.completed);
    if (completedTodos.length > 0) {
      yPosition += 10;
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 30;
      }
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 197, 94); // Green color for completed
      doc.text('✅ Completed Tasks', 20, yPosition);
      yPosition += 15;
      
      completedTodos.forEach((todo, index) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 30;
        }
        
        // Task box
        doc.setDrawColor(34, 197, 94);
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(15, yPosition - 5, pageWidth - 30, 15, 1, 1, 'FD');
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ☑ ${todo.content}`, 20, yPosition + 5);
        yPosition += 12;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        if (todo.due_date) {
          doc.text(`Completed: ${format(new Date(todo.due_date), 'PPP p')}`, 25, yPosition + 3);
          yPosition += 8;
        }
        yPosition += 8;
      });
    }
    
    if (todosInRange.length === 0) {
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text('📝 No tasks found in this date range', pageWidth / 2, yPosition, { align: 'center' });
    }
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generated by STOREALite', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    const filename = selectedProject 
      ? `${selectedProject.name}-todos-${exportFormat}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      : `todos-${exportFormat}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    
    doc.save(filename);
    
    toast({
      title: "Success",
      description: `To-Do list exported as PDF for ${exportFormat}`,
    });
    setIsExportDialogOpen(false);
  };

  const handleAddTodo = async () => {
    if (newTodo.trim()) {
      try {
        let todoContent = newTodo.trim();
        
        if (relatedInfo && relatedType) {
          todoContent += ` [${relatedType.toUpperCase()}: ${relatedInfo}]`;
        }

        const dueDateTime = attachToCalendar && dueDate ? new Date(dueDate).toISOString() : undefined;
        
        await createTodo(todoContent, priority, dueDateTime);
        
        // Reset form
        setNewTodo('');
        setPriority('medium');
        setAttachToCalendar(false);
        setDueDate('');
        setRelatedInfo('');
        setRelatedType('');
        setIsDialogOpen(false);
        
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
        await createTodo(newTodo.trim(), priority);
        setNewTodo('');
        setPriority('medium');
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

  const handleExport = () => {
    generatePDF();
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

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4 flex-shrink-0 border-b">
          <CardTitle className="text-lg flex items-center gap-2 font-medium">
            <CheckSquare className="h-5 w-5 text-primary" />
            To-Do List
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading todos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 font-medium">
            <CheckSquare className="h-5 w-5 text-primary" />
            To-Do List
            <Badge variant="secondary" className="ml-2">
              {pendingTodos.length} pending
            </Badge>
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
                  <DialogTitle>Export To-Do List</DialogTitle>
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4">
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
          <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
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

                <Separator />

                <div>
                  <Label>Related Information</Label>
                  <div className="space-y-2 mt-1">
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
                      <Select value={relatedInfo} onValueChange={setRelatedInfo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select document..." />
                        </SelectTrigger>
                        <SelectContent>
                          {documents.length > 0 ? (
                            documents.map((doc) => (
                              <SelectItem key={doc.id} value={doc.name || 'Untitled Document'}>
                                {doc.name || 'Untitled Document'}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-documents" disabled>No documents available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}

                    {relatedType === 'rfi' && (
                      <Select value={relatedInfo} onValueChange={setRelatedInfo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select RFI..." />
                        </SelectTrigger>
                        <SelectContent>
                          {rfis.length > 0 ? (
                            rfis.map((rfi) => (
                              <SelectItem key={rfi.id} value={rfi.rfi_number || rfi.subject || 'Untitled RFI'}>
                                {rfi.rfi_number || rfi.subject || 'Untitled RFI'}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-rfis" disabled>No RFIs available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}

                    {relatedType === 'message' && (
                      <Select value={relatedInfo} onValueChange={setRelatedInfo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select message..." />
                        </SelectTrigger>
                        <SelectContent>
                          {messages.length > 0 ? (
                            messages.map((message) => (
                              <SelectItem key={message.id} value={message.content?.substring(0, 50) || 'Empty message'}>
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

                <div className="flex gap-2">
                  <Button onClick={handleAddTodo} className="flex-1 gap-2" disabled={!newTodo.trim()}>
                    <Plus className="h-4 w-4" />
                    Create Task
                  </Button>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {pendingTodos.map((todo) => (
              <div key={todo.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <Checkbox
                    checked={todo.completed}
                    onCheckedChange={() => toggleTodo(todo.id)}
                  />
                  <div className="flex-1">
                    <p className="text-sm">{todo.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getPriorityColor(todo.priority)} className="text-xs">
                        {todo.priority}
                      </Badge>
                      {todo.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {new Date(todo.due_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTodo(todo.id)}
                  className="text-destructive hover:text-destructive h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {completedTodos.length > 0 && (
              <>
                <div className="border-t pt-2 mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Completed ({completedTodos.length})</p>
                  {completedTodos.map((todo) => (
                    <div key={todo.id} className="flex items-center justify-between p-2 border rounded-lg opacity-60">
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={() => toggleTodo(todo.id)}
                        />
                        <div className="flex-1">
                          <p className="text-sm line-through text-muted-foreground">{todo.content}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTodo(todo.id)}
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {todos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No todos yet</p>
                <p className="text-xs mt-1">Add your first task above!</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
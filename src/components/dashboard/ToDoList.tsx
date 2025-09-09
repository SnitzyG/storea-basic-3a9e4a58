import React, { useState } from 'react';
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
import { CheckSquare, Trash2, Plus, Calendar, FileText, MessageSquare, HelpCircle, Users, Download, Pencil } from 'lucide-react';
import { useTodos, Todo } from '@/hooks/useTodos';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export const ToDoList = () => {
  const [newTodo, setNewTodo] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [attachToCalendar, setAttachToCalendar] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [relatedInfo, setRelatedInfo] = useState('');
  const [relatedType, setRelatedType] = useState<'document' | 'rfi' | 'message' | ''>('');
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [exportFormat, setExportFormat] = useState<'day' | 'week' | 'fortnight' | 'month'>('week');
  const { todos, addTodo: createTodo, toggleTodo, deleteTodo, updateTodo, loading } = useTodos();
  const { toast } = useToast();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editDueDate, setEditDueDate] = useState('');

  const addCollaborator = () => {
    if (collaboratorEmail.trim() && !collaborators.includes(collaboratorEmail)) {
      setCollaborators([...collaborators, collaboratorEmail]);
      setCollaboratorEmail('');
    }
  };

  const removeCollaborator = (email: string) => {
    setCollaborators(collaborators.filter(e => e !== email));
  };

  const handleAddTodo = async () => {
    if (newTodo.trim()) {
      try {
        let todoContent = newTodo.trim();
        
        if (relatedInfo && relatedType) {
          todoContent += ` [${relatedType.toUpperCase()}: ${relatedInfo}]`;
        }
        
        if (collaborators.length > 0) {
          todoContent += ` (Collaborators: ${collaborators.join(', ')})`;
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
        setCollaborators([]);
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
    // Filter todos based on export format
    const now = new Date();
    let filteredTodos = todos;

    switch (exportFormat) {
      case 'day':
        filteredTodos = todos.filter(todo => 
          todo.due_date && format(new Date(todo.due_date), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
        );
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        filteredTodos = todos.filter(todo => {
          if (!todo.due_date) return false;
          const todoDate = new Date(todo.due_date);
          return todoDate >= weekStart && todoDate <= weekEnd;
        });
        break;
      case 'fortnight':
        const fortnightStart = new Date(now);
        fortnightStart.setDate(now.getDate() - now.getDay());
        const fortnightEnd = new Date(fortnightStart);
        fortnightEnd.setDate(fortnightStart.getDate() + 13);
        filteredTodos = todos.filter(todo => {
          if (!todo.due_date) return false;
          const todoDate = new Date(todo.due_date);
          return todoDate >= fortnightStart && todoDate <= fortnightEnd;
        });
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        filteredTodos = todos.filter(todo => {
          if (!todo.due_date) return false;
          const todoDate = new Date(todo.due_date);
          return todoDate >= monthStart && todoDate <= monthEnd;
        });
        break;
    }

    // Create PDF content as HTML
    const content = `
<!DOCTYPE html>
<html>
<head>
    <title>To-Do List - ${exportFormat}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .todo { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .todo-content { font-weight: bold; font-size: 16px; }
        .todo-due { color: #666; }
        .todo-completed { text-decoration: line-through; opacity: 0.6; }
        .priority-high { border-left: 4px solid #f44336; }
        .priority-medium { border-left: 4px solid #ff9800; }
        .priority-low { border-left: 4px solid #4caf50; }
        .status { font-size: 12px; padding: 2px 8px; border-radius: 12px; }
        .completed { background: #e8f5e8; color: #2e7d32; }
        .pending { background: #fff3e0; color: #f57c00; }
    </style>
</head>
<body>
    <h1>To-Do List - ${exportFormat.charAt(0).toUpperCase() + exportFormat.slice(1)}</h1>
    <p>Generated on: ${format(now, 'PPPp')}</p>
    <p>Total tasks: ${filteredTodos.length}</p>
    <p>Completed: ${filteredTodos.filter(t => t.completed).length}</p>
    <p>Pending: ${filteredTodos.filter(t => !t.completed).length}</p>
    ${filteredTodos.map(todo => `
        <div class="todo priority-${todo.priority} ${todo.completed ? 'todo-completed' : ''}">
            <div class="todo-content">${todo.content}</div>
            ${todo.due_date ? `<div class="todo-due">Due: ${format(new Date(todo.due_date), 'PPPp')}</div>` : ''}
            <span class="status ${todo.completed ? 'completed' : 'pending'}">
                ${todo.completed ? 'Completed' : 'Pending'} - ${todo.priority} priority
            </span>
        </div>
    `).join('')}
</body>
</html>
    `;

    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todos-${exportFormat}-${format(now, 'yyyy-MM-dd')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: `To-Do list exported for ${exportFormat}`,
    });
    setIsExportDialogOpen(false);
  };

  const openEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setEditContent(todo.content);
    setEditPriority(todo.priority);
    setEditDueDate(todo.due_date ? new Date(todo.due_date).toISOString().slice(0,16) : '');
    setIsEditOpen(true);
  };

  const handleUpdateTodo = async () => {
    if (!editingTodo) return;
    try {
      await updateTodo(editingTodo.id, {
        content: editContent.trim(),
        priority: editPriority,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
      } as Partial<Todo>);
      setIsEditOpen(false);
      setEditingTodo(null);
      toast({ title: 'Updated', description: 'Task updated successfully' });
    } catch (_) {
      toast({ title: 'Error', description: 'Failed to update task', variant: 'destructive' });
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

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">To-Do List</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading todos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            To-Do List
            <Badge variant="secondary" className="ml-2">
              {pendingTodos.length} pending
            </Badge>
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Detailed Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Detailed Task</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-4">
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
                  <div className="flex gap-2 mt-1">
                    <Select value={relatedType} onValueChange={(value: 'document' | 'rfi' | 'message' | '') => setRelatedType(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="rfi">RFI</SelectItem>
                        <SelectItem value="message">Message</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      value={relatedInfo}
                      onChange={(e) => setRelatedInfo(e.target.value)}
                      placeholder="Reference or ID"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Collaborators</Label>
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
                  {collaborators.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {collaborators.map((email) => (
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

                <div className="flex gap-2">
                  <Button onClick={handleAddTodo} className="flex-1">
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

        <ScrollArea className="h-80">
          <div className="space-y-2">
            {pendingTodos.map((todo) => (
              <div key={todo.id} className="flex items-center justify-between p-3 border rounded-lg">
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
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(todo)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTodo(todo.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
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
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(todo)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTodo(todo.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {todos.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                No todos yet. Add your first task above!
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      {/* Edit Task Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-content">Task</Label>
              <Textarea
                id="edit-content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={editPriority} onValueChange={(v: 'low' | 'medium' | 'high') => setEditPriority(v)}>
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
            <div>
              <Label htmlFor="edit-due">Due Date & Time</Label>
              <Input
                id="edit-due"
                type="datetime-local"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleUpdateTodo}>Save</Button>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
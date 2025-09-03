import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, User, X } from 'lucide-react';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  tags: string[];
  dueDate?: Date;
  assignedTo?: string;
}

export const ToDoList = () => {
  const [todos, setTodos] = useState<TodoItem[]>([
    {
      id: '1',
      title: 'Review architectural drawings for Project Alpha',
      completed: false,
      tags: ['urgent', 'review'],
      dueDate: new Date('2024-01-15'),
      assignedTo: 'John Smith'
    },
    {
      id: '2',
      title: 'Submit RFI response for structural changes',
      completed: false,
      tags: ['rfi', 'structural'],
      dueDate: new Date('2024-01-12'),
      assignedTo: 'Sarah Wilson'
    },
    {
      id: '3',
      title: 'Update project timeline documentation',
      completed: true,
      tags: ['documentation'],
      dueDate: new Date('2024-01-10')
    }
  ]);

  const [newTodo, setNewTodo] = useState('');
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'fortnightly' | 'monthly'>('weekly');

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo: TodoItem = {
        id: Date.now().toString(),
        title: newTodo,
        completed: false,
        tags: []
      };
      setTodos([todo, ...todos]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const removeTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const getFilteredTodos = () => {
    const now = new Date();
    const endDate = new Date();
    
    switch (viewMode) {
      case 'daily':
        endDate.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        endDate.setDate(now.getDate() + 7);
        break;
      case 'fortnightly':
        endDate.setDate(now.getDate() + 14);
        break;
      case 'monthly':
        endDate.setDate(now.getDate() + 30);
        break;
    }

    return todos.filter(todo => 
      !todo.dueDate || todo.dueDate <= endDate
    );
  };

  const filteredTodos = getFilteredTodos();
  const completedCount = filteredTodos.filter(todo => todo.completed).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          To-Do List ({filteredTodos.length - completedCount} pending)
        </CardTitle>
        
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="daily" className="text-xs">Daily</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs">Weekly</TabsTrigger>
            <TabsTrigger value="fortnightly" className="text-xs">Fortnightly</TabsTrigger>
            <TabsTrigger value="monthly" className="text-xs">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add new todo..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTodo()}
            className="text-sm"
          />
          <Button onClick={addTodo} size="sm" className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredTodos.map((todo) => (
            <div key={todo.id} className={`border rounded-lg p-3 space-y-2 ${todo.completed ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-2">
                <Checkbox 
                  checked={todo.completed}
                  onCheckedChange={() => toggleTodo(todo.id)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className={`text-sm ${todo.completed ? 'line-through' : ''}`}>
                    {todo.title}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {todo.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    
                    {todo.assignedTo && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {todo.assignedTo}
                      </div>
                    )}
                    
                    {todo.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {todo.dueDate.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTodo(todo.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {filteredTodos.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              No todos for {viewMode} view
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
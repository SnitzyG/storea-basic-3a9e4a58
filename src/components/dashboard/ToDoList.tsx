import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Calendar } from 'lucide-react';
import { useTodos, Todo } from '@/hooks/useTodos';

export const ToDoList = () => {
  const { todos, loading, addTodo: createTodo, toggleTodo, deleteTodo } = useTodos();
  const [newTodo, setNewTodo] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleAddTodo = async () => {
    if (newTodo.trim()) {
      await createTodo(newTodo.trim(), priority);
      setNewTodo('');
      setPriority('medium');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTodo();
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
        <CardTitle className="text-lg">To-Do List ({pendingTodos.length} pending)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add new task..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddTodo} size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-64">
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
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
    </Card>
  );
};
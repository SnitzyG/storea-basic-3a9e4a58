import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Todo {
  id: string;
  user_id: string;
  project_id?: string;
  content: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export const useTodos = (projectId?: string) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchTodos = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (projectId) {
        query = query.eq('project_id', projectId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTodos((data || []) as Todo[]);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (content: string, priority: 'low' | 'medium' | 'high' = 'medium', dueDate?: string) => {
    if (!user) return;

    try {
      const newTodo = {
        user_id: user.id,
        project_id: projectId,
        content,
        priority,
        due_date: dueDate,
      };

      const { data, error } = await supabase
        .from('todos')
        .insert([newTodo])
        .select()
        .maybeSingle();

      if (error) throw error;

      setTodos(prev => [data as Todo, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const updateTodo = async (id: string, updates: Partial<Todo>) => {
    try {
      const { data, error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTodos(prev => prev.map(todo => todo.id === id ? data as Todo : todo));
      return data;
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const toggleTodo = async (id: string) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    await updateTodo(id, { completed: !todo.completed });
  };

  useEffect(() => {
    fetchTodos();
  }, [user, projectId]);

  // Set up real-time subscription for todos
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('todos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTodos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, projectId]);

  // Set up additional real-time subscriptions for instant updates
  useEffect(() => {
    if (!user) return;

    const todosChannel = supabase
      .channel('todos-changes-enhanced')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Todo change detected:', payload);
          fetchTodos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(todosChannel);
    };
  }, [user?.id]);

  return {
    todos,
    loading,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    refetch: fetchTodos,
  };
};
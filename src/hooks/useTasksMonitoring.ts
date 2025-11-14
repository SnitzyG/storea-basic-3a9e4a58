import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isPast } from 'date-fns';

interface TasksMonitoring {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  tasksByPriority: { priority: string; count: number }[];
  mostProductiveUsers: { user_id: string; username: string; completed_count: number }[];
  recentTasks: any[];
}

export const useTasksMonitoring = () => {
  const [stats, setStats] = useState<TasksMonitoring | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const [
        totalResult,
        allTasksResult,
        recentResult,
      ] = await Promise.all([
        supabase.from('todos').select('*', { count: 'exact', head: true }),
        supabase.from('todos').select('*'),
        supabase.from('todos').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(10),
      ]);

      const allTasks = allTasksResult.data || [];
      
      const completedTasks = allTasks.filter(t => t.completed).length;
      const pendingTasks = allTasks.filter(t => !t.completed).length;
      const overdueTasks = allTasks.filter(t => !t.completed && t.due_date && isPast(new Date(t.due_date))).length;
      const completionRate = totalResult.count ? (completedTasks / totalResult.count) * 100 : 0;

      // Calculate tasks by priority
      const priorityMap = new Map<string, number>();
      allTasks.forEach((task: any) => {
        const priority = task.priority || 'medium';
        priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
      });

      // Calculate most productive users (by completed tasks)
      const userMap = new Map<string, { name: string; count: number }>();
      allTasks.filter(t => t.completed).forEach((task: any) => {
        if (task.user_id) {
          const existing = userMap.get(task.user_id);
          userMap.set(task.user_id, {
            name: 'User', // Get from profiles if needed
            count: (existing?.count || 0) + 1,
          });
        }
      });

      const mostProductiveUsers = Array.from(userMap.entries())
        .map(([id, data]) => ({ user_id: id, username: data.name, completed_count: data.count }))
        .sort((a, b) => b.completed_count - a.completed_count)
        .slice(0, 5);

      setStats({
        totalTasks: totalResult.count || 0,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
        tasksByPriority: Array.from(priorityMap.entries()).map(([priority, count]) => ({ priority, count })),
        mostProductiveUsers,
        recentTasks: recentResult.data || [],
      });
    } catch (error) {
      console.error('Error fetching tasks monitoring stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('tasks-monitoring')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
};

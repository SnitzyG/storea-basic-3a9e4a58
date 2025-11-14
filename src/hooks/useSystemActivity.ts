import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityLog {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  description: string;
  metadata: any;
  project_id?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
}

interface UseSystemActivityOptions {
  userId?: string;
  entityType?: string;
  action?: string;
  projectId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}

export function useSystemActivity(options: UseSystemActivityOptions = {}) {
  return useQuery({
    queryKey: ['system-activity', options],
    queryFn: async () => {
      let query = supabase
        .from('activity_log')
        .select(`
          *,
          user:profiles!activity_log_user_id_fkey (
            name,
            user_id
          )
        `);

      if (options.userId) query = query.eq('user_id', options.userId);
      if (options.entityType) query = query.eq('entity_type', options.entityType);
      if (options.action) query = query.eq('action', options.action);
      if (options.projectId) query = query.eq('project_id', options.projectId);
      if (options.dateFrom) query = query.gte('created_at', options.dateFrom.toISOString());
      if (options.dateTo) query = query.lte('created_at', options.dateTo.toISOString());

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(options.limit || 100);

      if (error) throw error;
      return (data || []) as any[];
    },
  });
}

export function useRealtimeActivity(options: UseSystemActivityOptions = {}) {
  const { data: activities, refetch } = useSystemActivity(options);

  // Set up real-time subscription
  useQuery({
    queryKey: ['activity-subscription'],
    queryFn: () => {
      const channel = supabase
        .channel('activity-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'activity_log',
          },
          () => {
            refetch();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    },
    refetchInterval: false,
  });

  return activities;
}

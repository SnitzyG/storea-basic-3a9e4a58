import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ActivityItem {
  id: string;
  user_id: string;
  project_id?: string;
  entity_type: string;
  entity_id?: string;
  action: string;
  description: string;
  metadata: any;
  created_at: string;
  user_profile?: {
    name: string;
    role: string;
  };
  project?: {
    name: string;
  };
}

export const useActivity = (projectId?: string) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchActivities = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (projectId) {
        query = query.eq('project_id', projectId);
      } else {
        // For dashboard, show activities from user's projects only
        const { data: userProjects } = await supabase
          .from('project_users')
          .select('project_id')
          .eq('user_id', user.id);
        
        if (userProjects?.length) {
          const projectIds = userProjects.map(p => p.project_id);
          query = query.in('project_id', projectIds);
        }
      }

      // Filter activities from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = query.gte('created_at', thirtyDaysAgo.toISOString());

      const { data: activitiesData, error } = await query;

      if (error) throw error;

      // Fetch user profiles and project names
      const userIds = [...new Set(activitiesData.map(a => a.user_id))];
      const projectIds = [...new Set(activitiesData.map(a => a.project_id).filter(Boolean))];

      const [{ data: profiles }, { data: projects }] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, name, role')
          .in('user_id', userIds),
        projectIds.length > 0
          ? supabase
              .from('projects')
              .select('id, name')
              .in('id', projectIds)
          : Promise.resolve({ data: [] })
      ]);

      const profileMap = new Map<string, any>();
      profiles?.forEach(p => profileMap.set(p.user_id, p));
      const projectMap = new Map<string, any>();
      projects?.forEach(p => projectMap.set(p.id, p));

      const enrichedActivities = activitiesData.map(activity => ({
        ...activity,
        user_profile: profileMap.get(activity.user_id),
        project: activity.project_id ? projectMap.get(activity.project_id) : undefined,
      }));

      setActivities(enrichedActivities as ActivityItem[]);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (activity: {
    project_id?: string;
    entity_type: string;
    entity_id?: string;
    action: string;
    description: string;
    metadata?: any;
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('activity_log')
        .insert([{
          user_id: user.id,
          ...activity,
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [user, projectId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

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
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, projectId]);

  return {
    activities,
    loading,
    logActivity,
    refetch: fetchActivities,
  };
};
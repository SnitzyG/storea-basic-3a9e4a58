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

export const useActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [allActivities, setAllActivities] = useState<ActivityItem[]>([]);
  const [dismissedActivityIds, setDismissedActivityIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchActivities = async () => {
    if (!user) return;

    try {
      // Get all projects the user has access to
      const { data: projectUsers, error: projectsError } = await supabase
        .from('project_users')
        .select('project_id')
        .eq('user_id', user.id);

      if (projectsError) throw projectsError;

      const projectIds = projectUsers?.map(pu => pu.project_id) || [];

      // Fetch more activities to account for dismissed ones (limit to 20 to get enough for filtering)
      let query = supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Filter to show activities by or affecting the user
      if (projectIds.length > 0) {
        query = query.or(`user_id.eq.${user.id},project_id.in.(${projectIds.join(',')}),project_id.is.null`);
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data: activitiesData, error } = await query;

      if (error) throw error;

      // Fetch user profiles and project names separately
      const userIds = [...new Set(activitiesData?.map(a => a.user_id) || [])];
      const activityProjectIds = [...new Set(activitiesData?.map(a => a.project_id).filter(Boolean) || [])];

      const [{ data: profiles }, { data: projects }] = await Promise.all([
        userIds.length > 0 
          ? supabase
              .from('profiles')
              .select('user_id, name, role')
              .in('user_id', userIds)
          : Promise.resolve({ data: [] }),
        activityProjectIds.length > 0
          ? supabase
              .from('projects')
              .select('id, name')
              .in('id', activityProjectIds)
          : Promise.resolve({ data: [] })
      ]);

      // Map profiles and projects
      const profileMap = new Map<string, any>();
      profiles?.forEach(p => profileMap.set(p.user_id, p));
      const projectMap = new Map<string, any>();
      projects?.forEach(p => projectMap.set(p.id, p));

      // Enrich activities with user and project data
      const enrichedActivities = (activitiesData || []).map(activity => ({
        ...activity,
        user_profile: profileMap.get(activity.user_id),
        project: activity.project_id ? projectMap.get(activity.project_id) : undefined,
      })) as ActivityItem[];

      setAllActivities(enrichedActivities);
      
      // Filter out dismissed activities and take only 4
      const visibleActivities = enrichedActivities
        .filter(activity => {
          // Check if activity is dismissed by this user
          const metadata = (typeof activity.metadata === 'object' && activity.metadata !== null && !Array.isArray(activity.metadata)) ? activity.metadata : {};
          const dismissedBy = Array.isArray((metadata as any).dismissed_by) ? (metadata as any).dismissed_by : [];
          return !dismissedBy.includes(user.id);
        })
        .slice(0, 4);
      
      setActivities(visibleActivities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
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

  const dismissActivity = async (activityId: string) => {
    if (!user) return;

    try {
      // Get the current activity
      const { data: activity, error: fetchError } = await supabase
        .from('activity_log')
        .select('metadata')
        .eq('id', activityId)
        .maybeSingle();

      if (!activity) {
        console.error('Activity not found');
        return;
      }

      if (fetchError) throw fetchError;

      // Update metadata to include this user in dismissed_by array
      const currentMetadata = (typeof activity.metadata === 'object' && activity.metadata !== null && !Array.isArray(activity.metadata)) ? activity.metadata : {};
      const dismissedBy = Array.isArray((currentMetadata as any).dismissed_by) ? (currentMetadata as any).dismissed_by : [];
      
      if (!dismissedBy.includes(user.id)) {
        dismissedBy.push(user.id);
      }

      const updatedMetadata = {
        ...(typeof currentMetadata === 'object' && !Array.isArray(currentMetadata) ? currentMetadata : {}),
        dismissed_by: dismissedBy
      };

      // Update the activity in the database
      const { error } = await supabase
        .from('activity_log')
        .update({ metadata: updatedMetadata })
        .eq('id', activityId);

      if (error) throw error;

      // Update local state to remove the activity immediately
      setDismissedActivityIds(prev => new Set([...prev, activityId]));
      setActivities(prev => prev.filter(activity => activity.id !== activityId));
      
      // Also refresh to get more activities to fill the space
      setTimeout(() => fetchActivities(), 100);
    } catch (error) {
      console.error('Error dismissing activity:', error);
      // Fallback to local dismissal if database operation fails
      setDismissedActivityIds(prev => new Set([...prev, activityId]));
    }
  };

  // Update visible activities when dismissed items change
  useEffect(() => {
    if (allActivities.length > 0) {
      const visibleActivities = allActivities
        .filter(activity => {
          // Check if activity is dismissed by this user
          const metadata = (typeof activity.metadata === 'object' && activity.metadata !== null && !Array.isArray(activity.metadata)) ? activity.metadata : {};
          const dismissedBy = Array.isArray((metadata as any).dismissed_by) ? (metadata as any).dismissed_by : [];
          return !dismissedBy.includes(user.id) && !dismissedActivityIds.has(activity.id);
        })
        .slice(0, 4);
      setActivities(visibleActivities);
    }
  }, [dismissedActivityIds, allActivities, user]);

  useEffect(() => {
    fetchActivities();
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('activity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
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
  }, [user]);

  return {
    activities,
    loading,
    logActivity,
    dismissActivity,
    refetch: fetchActivities,
  };
};
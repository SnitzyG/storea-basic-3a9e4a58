import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at?: string;
  user_profile: {
    name: string;
    role: string;
    avatar_url?: string;
    phone?: string;
  } | null;
  isOnline?: boolean;
  lastActive?: string;
}

export const useTeamSync = (projectId: string) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeamMembers = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      
      // First, get project users
      const { data: projectUsersData, error: projectUsersError } = await supabase
        .from('project_users')
        .select('id, user_id, role, joined_at')
        .eq('project_id', projectId);

      if (projectUsersError) {
        console.error('Error fetching project users:', projectUsersError);
        return;
      }

      if (!projectUsersData || projectUsersData.length === 0) {
        setTeamMembers([]);
        return;
      }

      // Then, get user profiles for these users
      const userIds = projectUsersData.map(user => user.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, role, avatar_url, phone')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Transform data to match expected format
      const transformedMembers: TeamMember[] = projectUsersData.map(user => {
        const profile = profilesData?.find(p => p.user_id === user.user_id);
        return {
          id: user.id,
          user_id: user.user_id,
          role: user.role,
          joined_at: user.joined_at,
          user_profile: profile ? {
            name: profile.name,
            role: profile.role,
            avatar_url: profile.avatar_url || undefined,
            phone: profile.phone || undefined
          } : null,
          isOnline: Math.random() > 0.5, // Mock online status for now
          lastActive: new Date(Date.now() - Math.random() * 86400000).toISOString()
        };
      }).filter(member => member.user_profile !== null);

      setTeamMembers(transformedMembers);
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Real-time sync for team changes
  useEffect(() => {
    fetchTeamMembers();

    // Subscribe to project_users changes
    const subscription = supabase
      .channel(`project_users_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_users',
          filter: `project_id=eq.${projectId}`
        },
        () => {
          fetchTeamMembers();
        }
      )
      .subscribe();

    // Listen for custom team update events
    const handleTeamUpdate = () => {
      fetchTeamMembers();
    };

    window.addEventListener('projectTeamUpdated', handleTeamUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('projectTeamUpdated', handleTeamUpdate);
    };
  }, [projectId, fetchTeamMembers]);

  const refreshTeam = useCallback(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  return {
    teamMembers,
    loading,
    refreshTeam
  };
};
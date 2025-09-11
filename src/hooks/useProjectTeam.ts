import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMember {
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

interface UseProjectTeamReturn {
  teamMembers: TeamMember[];
  loading: boolean;
  error: string | null;
  addMember: (email: string, name: string, role: string) => Promise<boolean>;
  removeMember: (userId: string) => Promise<boolean>;
  refreshTeam: () => Promise<void>;
}

export const useProjectTeam = (projectId: string): UseProjectTeamReturn => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeamMembers = useCallback(async () => {
    if (!projectId) {
      setTeamMembers([]);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get project users with their profiles
      const { data: projectUsersData, error: projectUsersError } = await supabase
        .from('project_users')
        .select('id, user_id, role, joined_at')
        .eq('project_id', projectId);

      if (projectUsersError) {
        console.error('Error fetching project users:', projectUsersError);
        setError('Failed to fetch team members');
        return;
      }

      if (!projectUsersData || projectUsersData.length === 0) {
        setTeamMembers([]);
        return;
      }

      // Get user profiles for these users
      const userIds = projectUsersData.map(user => user.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, role, avatar_url, phone')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setError('Failed to fetch user profiles');
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
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const addMember = useCallback(async (email: string, name: string, role: string): Promise<boolean> => {
    try {
      // Check if user already exists with this email
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .ilike('name', `%${email}%`);

      let addedSuccessfully = false;

      // If we find an existing user, add them directly
      if (existingProfiles && existingProfiles.length > 0) {
        const existingUser = existingProfiles[0];
        
        // Check if user is already in project
        const { data: existingProjectUser } = await supabase
          .from('project_users')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', existingUser.user_id)
          .single();

        if (!existingProjectUser) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          const { error: addError } = await supabase
            .from('project_users')
            .insert({
              project_id: projectId,
              user_id: existingUser.user_id,
              role: role as 'architect' | 'builder' | 'homeowner' | 'contractor',
              invited_by: currentUser?.id,
              joined_at: new Date().toISOString()
            });

          if (!addError) {
            addedSuccessfully = true;
            // Trigger immediate refresh
            await fetchTeamMembers();
          }
        }
      }

      // If no existing user found, create pending invitation
      if (!addedSuccessfully) {
        const { data: currentProject } = await supabase
          .from('projects')
          .select('timeline')
          .eq('id', projectId)
          .single();

        const currentTimeline = (currentProject?.timeline as any) || {};
        const pendingCollaborators = currentTimeline.pending_collaborators || [];

        await supabase
          .from('projects')
          .update({
            timeline: {
              ...currentTimeline,
              pending_collaborators: [...pendingCollaborators, { email, name, role }]
            }
          })
          .eq('id', projectId);
      }

      // Trigger global update events
      window.dispatchEvent(new CustomEvent('teamMembersUpdated', { 
        detail: { projectId } 
      }));
      window.dispatchEvent(new CustomEvent('projectTeamUpdated'));

      return true;
    } catch (error) {
      console.error('Error adding team member:', error);
      setError('Failed to add team member');
      return false;
    }
  }, [projectId, fetchTeamMembers]);

  const removeMember = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('project_users')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing team member:', error);
        setError('Failed to remove team member');
        return false;
      }

      // Trigger immediate refresh
      await fetchTeamMembers();
      
      // Trigger global update events
      window.dispatchEvent(new CustomEvent('teamMembersUpdated', { 
        detail: { projectId } 
      }));
      window.dispatchEvent(new CustomEvent('projectTeamUpdated'));

      return true;
    } catch (error) {
      console.error('Error removing team member:', error);
      setError('Failed to remove team member');
      return false;
    }
  }, [projectId, fetchTeamMembers]);

  const refreshTeam = useCallback(async () => {
    await fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Real-time sync for team changes with immediate updates
  useEffect(() => {
    fetchTeamMembers();

    // Subscribe to project_users changes with immediate UI update
    const subscription = supabase
      .channel(`unified_project_users_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_users',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Project users changed:', payload);
          // Force immediate refetch to sync across all components
          fetchTeamMembers();
          
          // Dispatch global event for cross-component sync
          window.dispatchEvent(new CustomEvent('teamMembersUpdated', { 
            detail: { projectId, payload } 
          }));
        }
      )
      .subscribe();

    // Subscribe to profiles changes to update user info immediately
    const profilesSubscription = supabase
      .channel(`unified_profiles_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Profiles changed:', payload);
          // Immediate refetch for profile updates
          fetchTeamMembers();
          
          // Dispatch event for other components
          window.dispatchEvent(new CustomEvent('teamMembersUpdated', { 
            detail: { projectId, payload } 
          }));
        }
      )
      .subscribe();

    // Listen for custom team update events
    const handleGlobalTeamUpdate = (event: any) => {
      if (!event.detail?.projectId || event.detail.projectId === projectId) {
        fetchTeamMembers();
      }
    };

    const handleProjectTeamUpdate = () => {
      fetchTeamMembers();
    };

    window.addEventListener('teamMembersUpdated', handleGlobalTeamUpdate);
    window.addEventListener('projectTeamUpdated', handleProjectTeamUpdate);

    return () => {
      subscription.unsubscribe();
      profilesSubscription.unsubscribe();
      window.removeEventListener('teamMembersUpdated', handleGlobalTeamUpdate);
      window.removeEventListener('projectTeamUpdated', handleProjectTeamUpdate);
    };
  }, [projectId, fetchTeamMembers]);

  return {
    teamMembers,
    loading,
    error,
    addMember,
    removeMember,
    refreshTeam
  };
};
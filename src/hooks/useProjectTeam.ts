import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TeamMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  added_at: string;
  added_by?: string;
  email: string;
  full_name?: string;
  name: string;
  avatar_url?: string;
  online_status?: boolean;
  last_seen?: string;
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
  count: number;
  addMember: (email: string, role: string) => Promise<boolean>;
  removeMember: (memberId: string) => Promise<boolean>;
  refreshTeam: () => Promise<void>;
}

export const useProjectTeam = (projectId: string): UseProjectTeamReturn => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTeamMembers = useCallback(async () => {
    if (!projectId) {
      setTeamMembers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch team members from project_users
      const { data: projectUsersData, error: projectUsersError } = await supabase
        .from('project_users')
        .select('id, project_id, user_id, role, joined_at, invited_by')
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
        .select('user_id, name, full_name, avatar_url, online_status, last_seen, role, phone')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setError('Failed to fetch user profiles');
        return;
      }

      // Get user emails from auth
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      
      // Transform data to match interface
      const transformedMembers: TeamMember[] = projectUsersData.map(member => {
        const authUser = authUsers?.users?.find((u: any) => u.id === member.user_id);
        const profile = profilesData?.find(p => p.user_id === member.user_id);
        
        return {
          id: member.id,
          project_id: member.project_id,
          user_id: member.user_id,
          role: member.role,
          added_at: member.joined_at || new Date().toISOString(),
          added_by: member.invited_by,
          email: authUser?.email || '',
          full_name: profile?.full_name || profile?.name,
          name: profile?.name || profile?.full_name || authUser?.email?.split('@')[0] || 'Unknown',
          avatar_url: profile?.avatar_url,
          online_status: profile?.online_status,
          last_seen: profile?.last_seen,
          user_profile: profile ? {
            name: profile.name || profile.full_name || 'Unknown',
            role: profile.role || member.role,
            avatar_url: profile.avatar_url,
            phone: profile.phone
          } : null,
          isOnline: profile?.online_status || false,
          lastActive: profile?.last_seen
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

  const addMember = useCallback(async (email: string, role: string): Promise<boolean> => {
    try {
      // Find user by email
      const { data: authData } = await supabase.auth.admin.listUsers();
      const user = authData?.users?.find((u: any) => u.email === email);
      
      if (!user) {
        toast({
          title: "User not found",
          description: "No user found with this email address. They need to sign up first.",
          variant: "destructive"
        });
        return false;
      }

      // Check if user is already a team member
      const { data: existing } = await supabase
        .from('project_users')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        toast({
          title: "Already a member",
          description: "This user is already a team member.",
          variant: "destructive"
        });
        return false;
      }

      // Get current user for added_by
      const { data: currentUser } = await supabase.auth.getUser();

      // Add team member
      const { error } = await supabase
        .from('project_users')
        .insert({
          project_id: projectId,
          user_id: user.id,
          role: role as 'architect' | 'builder' | 'homeowner' | 'contractor',
          invited_by: currentUser.user?.id,
          joined_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error adding team member:', error);
        toast({
          title: "Error adding member",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Member added!",
        description: `${email} has been added to the team.`
      });

      // Refresh team list
      await fetchTeamMembers();
      return true;
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error adding member",
        description: "Failed to add team member. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [projectId, fetchTeamMembers, toast]);

  const removeMember = useCallback(async (memberId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('project_users')
        .delete()
        .eq('id', memberId);

      if (error) {
        console.error('Error removing team member:', error);
        toast({
          title: "Error removing member",
          description: error.message,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Member removed!",
        description: "Team member has been removed from the project."
      });

      // Refresh team list
      await fetchTeamMembers();
      return true;
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        title: "Error removing member",
        description: "Failed to remove team member. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [fetchTeamMembers, toast]);

  const refreshTeam = useCallback(async () => {
    await fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Real-time subscription for team changes
  useEffect(() => {
    fetchTeamMembers();

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

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId, fetchTeamMembers]);

  return {
    teamMembers,
    loading,
    error,
    count: teamMembers.length,
    addMember,
    removeMember,
    refreshTeam
  };
};
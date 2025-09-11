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
  addMember: (email: string, role: string, projectName?: string) => Promise<boolean>;
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

      // Fetch team members from project_users with better ordering
      const { data: projectUsersData, error: projectUsersError } = await supabase
        .from('project_users')
        .select('id, project_id, user_id, role, joined_at, invited_by')
        .eq('project_id', projectId)
        .order('joined_at', { ascending: false }); // Show newest members first

      if (projectUsersError) {
        console.error('Error fetching project users:', projectUsersError);
        setError('Failed to fetch team members');
        return;
      }

      if (!projectUsersData || projectUsersData.length === 0) {
        setTeamMembers([]);
        return;
      }

      // Get user profiles for these users with better selection
      const userIds = projectUsersData.map(user => user.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, name, full_name, avatar_url, online_status, last_seen, role, phone, updated_at')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        setError('Failed to fetch user profiles');
        return;
      }

      // Get user emails from auth (only if we have profiles)
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      console.log(`Found ${projectUsersData.length} project users and ${profilesData?.length || 0} profiles`);
      
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

      console.log(`Transformed ${transformedMembers.length} team members for project ${projectId}`);
      setTeamMembers(transformedMembers);
      
      // Also fetch pending invitations to show invited users
      const { data: pendingInvitations } = await supabase
        .from('project_pending_invitations')
        .select('email, role, created_at, invited_by')
        .eq('project_id', projectId)
        .gt('expires_at', new Date().toISOString());
      
      if (pendingInvitations && pendingInvitations.length > 0) {
        console.log(`Found ${pendingInvitations.length} pending invitations`);
        // You could emit these as a separate state if needed for UI display
      }
    } catch (error) {
      console.error('Error in fetchTeamMembers:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const addMember = useCallback(async (email: string, role: string, projectName: string = 'Project'): Promise<boolean> => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast({
          title: "Invalid email",
          description: "Please enter a valid email address.",
          variant: "destructive"
        });
        return false;
      }

      // Get current user
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        toast({
          title: "Authentication error",
          description: "You must be logged in to add team members.",
          variant: "destructive"
        });
        return false;
      }

      // Get user profile for inviter name
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, full_name')
        .eq('user_id', currentUser.user.id)
        .single();

      const inviterName = profile?.name || profile?.full_name || currentUser.user.email?.split('@')[0] || 'Someone';

      // Check if email is already a team member or has pending invitation
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const existingUser = authUsers?.users?.find((u: any) => u.email === email);
      
      if (existingUser) {
        // Check if already a team member
        const { data: isTeamMember } = await supabase
          .from('project_users')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', existingUser.id)
          .single();

        if (isTeamMember) {
          toast({
            title: "Already a member",
            description: "This user is already a team member.",
            variant: "destructive"
          });
          return false;
        }

        // User exists but not a member, add them directly
        const { error } = await supabase
          .from('project_users')
          .insert({
            project_id: projectId,
            user_id: existingUser.id,
            role: role as 'architect' | 'builder' | 'homeowner' | 'contractor',
            invited_by: currentUser.user.id,
            joined_at: new Date().toISOString()
          });

        if (error) {
          console.error('Error adding existing user:', error);
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

        await fetchTeamMembers();
        return true;
      }

      // Check for existing pending invitation
      const { data: existingInvitation } = await supabase
        .from('project_pending_invitations')
        .select('id')
        .eq('project_id', projectId)
        .eq('email', email)
        .single();

      if (existingInvitation) {
        toast({
          title: "Invitation already sent",
          description: "An invitation has already been sent to this email address.",
          variant: "destructive"
        });
        return false;
      }

      // Send invitation via edge function
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        toast({
          title: "Authentication error",
          description: "Please log in again.",
          variant: "destructive"
        });
        return false;
      }

      const { data, error } = await supabase.functions.invoke('send-team-invitation', {
        body: {
          projectId,
          email,
          role,
          projectName,
          inviterName
        },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        console.error('Error sending invitation:', error);
        toast({
          title: "Error sending invitation",
          description: "Failed to send invitation email. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      if (data?.error) {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Invitation sent!",
        description: `An invitation has been sent to ${email}. They will be added to the team when they accept.`
      });

      // Refresh to show any immediate changes
      await fetchTeamMembers();
      return true;
    } catch (error) {
      console.error('Error in addMember:', error);
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

  // Real-time subscription for team changes with enhanced monitoring
  useEffect(() => {
    fetchTeamMembers();

    const subscription = supabase
      .channel(`project_team_${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_users',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Project users change detected:', payload);
          // Immediate refetch to ensure UI is updated
          setTimeout(() => fetchTeamMembers(), 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_pending_invitations',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Pending invitations change detected:', payload);
          setTimeout(() => fetchTeamMembers(), 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          // Check if any team member's profile was updated
          const updatedUserId = payload.new?.user_id;
          if (updatedUserId && teamMembers.some(m => m.user_id === updatedUserId)) {
            console.log('Team member profile updated:', updatedUserId);
            setTimeout(() => fetchTeamMembers(), 100);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId, fetchTeamMembers, teamMembers]);

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
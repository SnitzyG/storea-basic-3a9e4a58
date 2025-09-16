import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRateLimit } from '@/hooks/useRateLimit';
import { createInvitationSentNotification } from '@/utils/teamNotifications';
import { validateInvitationRequest } from '@/utils/invitationValidation';

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
  const { checkInviteLimit } = useRateLimit();

  const fetchTeamMembers = useCallback(async () => {
    if (!projectId || projectId === 'all') {
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
        .from('invitations')
        .select('email, role, created_at, inviter_id')
        .eq('project_id', projectId)
        .eq('status', 'pending')
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

      // Check rate limit
      const rateLimit = checkInviteLimit(projectId, currentUser.user.id);
      if (!rateLimit.allowed) {
        toast({
          title: "Rate limit exceeded",
          description: `Too many invitations sent. Please wait ${rateLimit.resetIn} seconds before sending another invitation.`,
          variant: "destructive"
        });
        return false;
      }

      // Comprehensive validation
      const validation = await validateInvitationRequest(projectId, email, role, currentUser.user.id);
      if (!validation.isValid) {
        toast({
          title: validation.error || "Validation failed",
          description: validation.suggestion || "Please check your input and try again.",
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
        .from('invitations')
        .select('id')
        .eq('project_id', projectId)
        .eq('email', email)
        .eq('status', 'pending')
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
        
        // More specific error handling based on error details
        let errorTitle = "Invitation could not be sent";
        let errorDescription = "Please try again. If the problem persists, contact support.";
        
        if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
          errorTitle = "Network error";
          errorDescription = "Please check your internet connection and try again.";
        } else if (error.message?.includes('unauthorized') || error.message?.includes('401')) {
          errorTitle = "Authentication error";
          errorDescription = "Please log in again and try sending the invitation.";
        } else if (error.message?.includes('forbidden') || error.message?.includes('403')) {
          errorTitle = "Permission denied";
          errorDescription = "You don't have permission to invite members to this project.";
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive"
        });
        return false;
      }

      if (data?.error) {
        // Enhanced error handling with specific messages based on error type
        let errorTitle = "Invitation failed";
        let errorDescription = data.error;
        
        if (data.isConfigurationIssue) {
          errorTitle = "Email service configuration required";
          errorDescription = "The email service needs to be set up by an administrator. Please contact support.";
        } else if (data.method === 'all_failed') {
          errorTitle = "Email delivery failed";
          errorDescription = "All email delivery methods failed. Please check your internet connection or contact support.";
        } else if (data.method === 'supabase_auth') {
          errorTitle = "Invitation delivery issue";
          errorDescription = data.error;
        } else if (data.error.includes('domain') || data.error.includes('verify')) {
          errorTitle = "Email delivery issue";
          errorDescription = "Email could not be delivered. Please check the email address or contact support.";
        } else if (data.error.includes('rate limit') || data.error.includes('too many')) {
          errorTitle = "Too many requests";
          errorDescription = "Please wait a few minutes before sending another invitation.";
        } else if (data.error.includes('Invalid email') || data.error.includes('invalid email')) {
          errorTitle = "Invalid email address";
          errorDescription = "Please check the email address format and try again.";
        } else if (data.error.includes('already') || data.error.includes('exists')) {
          errorTitle = "Already invited or exists";
          errorDescription = "This user has already been invited or is already a team member.";
        }

        toast({
          title: errorTitle,
          description: errorDescription,
          variant: "destructive"
        });
        return false;
      }

      // Success - show confirmation toast
      toast({
        title: "Invitation sent!",
        description: `Invitation sent to ${email}. They will receive an email with instructions to join the project.`
      });

      // Create notification for the inviter
      await createInvitationSentNotification(currentUser.user.id, email, projectName);

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

  // Real-time subscription for team changes with debounced updates
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
          // Debounced refetch to prevent rapid re-renders
          fetchTeamMembers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invitations',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Invitations change detected:', payload);
          fetchTeamMembers();
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
          // Only refetch if a team member's profile was updated
          const updatedUserId = payload.new?.user_id;
          const currentTeamUserIds = teamMembers.map(m => m.user_id);
          if (updatedUserId && currentTeamUserIds.includes(updatedUserId)) {
            console.log('Team member profile updated:', updatedUserId);
            fetchTeamMembers();
          }
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
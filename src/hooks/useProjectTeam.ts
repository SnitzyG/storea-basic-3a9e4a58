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

      // Fetch team members from project_users with enhanced selection
      const { data: projectUsersData, error: projectUsersError } = await supabase
        .from('project_users')
        .select(`
          id, 
          project_id, 
          user_id, 
          role, 
          joined_at, 
          invited_by,
          created_at
        `)
        .eq('project_id', projectId)
        .order('joined_at', { ascending: false }); // Show newest members first

      if (projectUsersError) {
        console.error('Error fetching project users:', projectUsersError);
        setError(`Failed to fetch team members: ${projectUsersError.message}`);
        return;
      }

      let transformedMembers: TeamMember[] = [];

      if (projectUsersData && projectUsersData.length > 0) {
        // Get user profiles for these users
        const userIds = projectUsersData.map(user => user.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            user_id, 
            name, 
            full_name, 
            avatar_url, 
            online_status, 
            last_seen, 
            role, 
            phone
          `)
          .in('user_id', userIds);

        if (profilesError) {
          console.warn('Error fetching profiles:', profilesError);
          // Continue with partial data instead of failing completely
        }

        // Transform active members
        transformedMembers = projectUsersData.map(member => {
          const profile = profilesData?.find(p => p.user_id === member.user_id);
          const displayName = profile?.name || profile?.full_name || `User ${member.user_id.slice(-4)}`;
          
          return {
            id: member.id,
            project_id: member.project_id,
            user_id: member.user_id,
            role: member.role,
            added_at: member.joined_at || member.created_at || new Date().toISOString(),
            added_by: member.invited_by,
            email: '', // Not available client-side
            full_name: profile?.full_name || profile?.name,
            name: displayName,
            avatar_url: profile?.avatar_url,
            online_status: profile?.online_status || false,
            last_seen: profile?.last_seen,
            user_profile: {
              name: displayName,
              role: profile?.role || member.role,
              avatar_url: profile?.avatar_url,
              phone: profile?.phone
            },
            isOnline: profile?.online_status || false,
            lastActive: profile?.last_seen
          };
        });
      }

      // Fetch pending invitations and add them as pending members
      const { data: pendingInvitations, error: invitationsError } = await supabase
        .from('invitations')
        .select('id, email, role, created_at, inviter_id, status, expires_at')
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());
      
      if (invitationsError) {
        console.warn('Error fetching pending invitations:', invitationsError);
      } else if (pendingInvitations && pendingInvitations.length > 0) {
        // Add pending invitations as team members with pending status
        const pendingMembers: TeamMember[] = pendingInvitations.map(invitation => ({
          id: `invitation-${invitation.id}`,
          project_id: projectId,
          user_id: `pending-${invitation.email}`,
          role: invitation.role,
          added_at: invitation.created_at,
          added_by: invitation.inviter_id,
          email: invitation.email,
          full_name: invitation.email.split('@')[0],
          name: `${invitation.email.split('@')[0]} (Pending)`,
          avatar_url: undefined,
          online_status: false,
          last_seen: undefined,
          user_profile: {
            name: `${invitation.email.split('@')[0]} (Pending)`,
            role: invitation.role,
            avatar_url: undefined,
            phone: undefined
          },
          isOnline: false,
          lastActive: undefined
        }));

        transformedMembers = [...transformedMembers, ...pendingMembers];
        console.log(`Added ${pendingInvitations.length} pending invitations to team list`);
      }

      console.log(`Successfully loaded ${transformedMembers.length} team members for project ${projectId}`);
      setTeamMembers(transformedMembers);

    } catch (error) {
      console.error('Unexpected error in fetchTeamMembers:', error);
      setError('An unexpected error occurred while loading team members');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const addMember = useCallback(async (email: string, role: string, projectName: string = 'Project'): Promise<boolean> => {
    // Input validation
    if (!email?.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return false;
    }

    if (!role?.trim()) {
      toast({
        title: "Role required", 
        description: "Please select a role for the team member.",
        variant: "destructive"
      });
      return false;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Get current user with error handling
      const { data: currentUser, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser.user) {
        console.error('Auth error in addMember:', authError);
        toast({
          title: "Authentication error",
          description: "You must be logged in to add team members.",
          variant: "destructive"
        });
        return false;
      }

      // Check if user is already a team member
      const { data: existingMember } = await supabase
        .from('project_users')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', currentUser.user.id)
        .maybeSingle();

      if (!existingMember) {
        toast({
          title: "Permission denied",
          description: "You must be a team member to invite others.",
          variant: "destructive"
        });
        return false;
      }

      // Check for existing user with this email (via profiles, since we can't query auth.users directly)
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('user_id')
        .ilike('name', `%${email}%`) // This is a workaround since we can't query by email
        .maybeSingle();

      if (existingUser) {
        // Check if already a project member
        const { data: alreadyMember } = await supabase
          .from('project_users')
          .select('id')
          .eq('project_id', projectId)
          .eq('user_id', existingUser.user_id)
          .maybeSingle();

        if (alreadyMember) {
          toast({
            title: "Already a team member",
            description: "This user is already a member of this project.",
            variant: "destructive"
          });
          return false;
        }
      }

      // Check for existing pending invitation
      const { data: existingInvitation } = await supabase
        .from('invitations')
        .select('id, status, expires_at')
        .eq('project_id', projectId)
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (existingInvitation) {
        if (existingInvitation.status === 'pending' && new Date(existingInvitation.expires_at) > new Date()) {
          toast({
            title: "Invitation already sent",
            description: "An active invitation has already been sent to this email address.",
            variant: "destructive"
          });
          return false;
        }
      }

      // Get user profile for inviter info
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, full_name')
        .eq('user_id', currentUser.user.id)
        .maybeSingle();

      const inviterName = profile?.name || profile?.full_name || currentUser.user.email?.split('@')[0] || 'Team Member';

      // Create invitation record first (this ensures we have the invitation tracked)
      const { data: invitation, error: inviteError } = await supabase
        .from('invitations')
        .insert([{
          project_id: projectId,
          email: email.trim().toLowerCase(),
          role: role,
          inviter_id: currentUser.user.id,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
        }])
        .select()
        .single();

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);
        toast({
          title: "Failed to create invitation",
          description: "Could not create invitation record. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      // Optimistically update local state to show pending member
      const optimisticMember: TeamMember = {
        id: `pending-${Date.now()}`,
        project_id: projectId,
        user_id: `pending-${email}`,
        role: role,
        added_at: new Date().toISOString(),
        added_by: currentUser.user.id,
        email: email.trim().toLowerCase(),
        full_name: email.split('@')[0],
        name: email.split('@')[0],
        avatar_url: undefined,
        online_status: false,
        last_seen: undefined,
        user_profile: {
          name: email.split('@')[0],
          role: role,
          avatar_url: undefined,
          phone: undefined
        },
        isOnline: false,
        lastActive: undefined
      };

      // Add to current team members list
      setTeamMembers(prev => [optimisticMember, ...prev]);

      // Try to send email via edge function (optional - if it fails, invitation still exists)
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          const { error: emailError } = await supabase.functions.invoke('send-team-invitation', {
            body: {
              projectId,
              email: email.trim().toLowerCase(),
              role,
              projectName: projectName || 'Project',
              inviterName
            },
            headers: {
              Authorization: `Bearer ${sessionData.session.access_token}`,
            },
          });

          if (emailError) {
            console.warn('Email sending failed, but invitation was created:', emailError);
            // Don't fail the whole operation - invitation record exists
          }
        }
      } catch (emailError) {
        console.warn('Email service error:', emailError);
        // Continue - invitation record exists even if email fails
      }

      // Success feedback
      toast({
        title: "Invitation sent!",
        description: `Invitation sent to ${email}. They will be added to the project when they accept.`
      });

      // Create notification
      try {
        await createInvitationSentNotification(currentUser.user.id, email, projectName);
      } catch (notificationError) {
        console.warn('Notification creation failed:', notificationError);
        // Don't fail the operation for notification errors
      }

      return true;
    } catch (error) {
      console.error('Unexpected error in addMember:', error);
      toast({
        title: "Error adding member",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [projectId, toast]);

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

  // Real-time subscription for team changes with improved error handling
  useEffect(() => {
    if (!projectId || projectId === 'all') return;

    fetchTeamMembers();

    // Debounce refetch to prevent rapid updates
    let refetchTimeout: NodeJS.Timeout;
    const debouncedRefetch = () => {
      clearTimeout(refetchTimeout);
      refetchTimeout = setTimeout(() => {
        console.log('Debounced team refetch triggered');
        fetchTeamMembers();
      }, 500);
    };

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
          console.log('Project users change detected:', payload.eventType, payload);
          debouncedRefetch();
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
          console.log('Invitations change detected:', payload.eventType, payload);
          debouncedRefetch();
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
            debouncedRefetch();
          }
        }
      )
      .subscribe((status) => {
        console.log('Team subscription status:', status);
      });

    return () => {
      clearTimeout(refetchTimeout);
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
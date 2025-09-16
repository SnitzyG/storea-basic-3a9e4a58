import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProjectJoinRequest {
  id: string;
  project_id: string;
  requester_id: string;
  project_code: string;
  requester_name?: string;
  requester_email?: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  responded_at?: string;
  responded_by?: string;
  // Extended with project and requester details
  project?: {
    name: string;
    description?: string;
  };
  requester?: {
    name: string;
    avatar_url?: string;
    role: string;
  };
}

export const useProjectJoinRequests = () => {
  const [joinRequests, setJoinRequests] = useState<ProjectJoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchJoinRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get join requests for projects created by current user (as project creator)
      const { data: creatorRequests, error: creatorError } = await supabase
        .from('project_join_requests')
        .select(`
          *,
          projects!inner(name, description, created_by)
        `)
        .eq('projects.created_by', userData.user.id);

      if (creatorError) throw creatorError;

      // Get join requests made by current user (as requester)
      const { data: requesterRequests, error: requesterError } = await supabase
        .from('project_join_requests')
        .select(`
          *,
          projects(name, description)
        `)
        .eq('requester_id', userData.user.id);

      if (requesterError) throw requesterError;

      // Get requester profile information for creator requests
      const enrichedCreatorRequests = await Promise.all(
        (creatorRequests || []).map(async (request) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, avatar_url, role')
            .eq('user_id', request.requester_id)
            .maybeSingle();

          return {
            ...request,
            requester: profile,
            project: request.projects
          };
        })
      );

      // Combine and format all requests
      const allRequests: ProjectJoinRequest[] = [
        ...enrichedCreatorRequests.map(req => ({
          ...req,
          status: req.status as 'pending' | 'approved' | 'rejected'
        })),
        ...(requesterRequests || []).map(req => ({
          ...req,
          project: req.projects,
          status: req.status as 'pending' | 'approved' | 'rejected'
        }))
      ];

      setJoinRequests(allRequests);
    } catch (error: any) {
      console.error('Error fetching join requests:', error);
      toast({
        title: "Error fetching join requests",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const submitJoinRequest = async (projectCode: string, message?: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      // Find project by project_id (the 15-character code)
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('project_id', projectCode.toUpperCase())
        .maybeSingle();

      if (projectError) throw projectError;
      if (!project) {
        throw new Error('Project not found with the provided ID');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('project_users')
        .select('id')
        .eq('project_id', project.id)
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (existingMember) {
        throw new Error('You are already a member of this project');
      }

      // Check if there's already a pending request
      const { data: existingRequest } = await supabase
        .from('project_join_requests')
        .select('id, status')
        .eq('project_id', project.id)
        .eq('requester_id', userData.user.id)
        .maybeSingle();

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          throw new Error('You already have a pending request for this project');
        } else if (existingRequest.status === 'rejected') {
          throw new Error('Your previous request was rejected. Please contact the project owner.');
        }
      }

      // Create join request
      const { error } = await supabase
        .from('project_join_requests')
        .insert({
          project_id: project.id,
          requester_id: userData.user.id,
          project_code: projectCode.toUpperCase(),
          requester_name: profile?.name || userData.user.email,
          requester_email: userData.user.email,
          message: message || `${profile?.name || userData.user.email} would like to join ${project.name}`
        });

      if (error) throw error;

      // Create notification for project creator
      const { data: projectData } = await supabase
        .from('projects')
        .select('created_by, name')
        .eq('id', project.id)
        .single();

      if (projectData) {
        await supabase
          .from('notifications')
          .insert({
            user_id: projectData.created_by,
            type: 'join_request',
            title: 'New Team Member Request',
            message: `${profile?.name || userData.user.email} wants to join "${projectData.name}"`,
            data: {
              project_id: project.id,
              project_name: projectData.name,
              requester_id: userData.user.id,
              requester_name: profile?.name || userData.user.email,
              project_code: projectCode.toUpperCase()
            }
          });
      }

      await fetchJoinRequests();
      toast({
        title: "Join request sent",
        description: `Your request to join "${project.name}" has been sent to the project creator.`
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error sending join request",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const respondToJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      // Get the join request details
      const { data: request, error: requestError } = await supabase
        .from('project_join_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Update the request status
      const { error: updateError } = await supabase
        .from('project_join_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          responded_at: new Date().toISOString(),
          responded_by: userData.user.id
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // If approved, add user to project team
      if (action === 'approve') {
        const { error: memberError } = await supabase
          .from('project_users')
          .insert({
            project_id: request.project_id,
            user_id: request.requester_id,
            role: 'contractor', // Default role for joined members
            invited_by: userData.user.id,
            joined_at: new Date().toISOString()
          });

        if (memberError) throw memberError;
      }

      // Create notification for requester
      const actionText = action === 'approve' ? 'approved' : 'rejected';
      await supabase
        .from('notifications')
        .insert({
          user_id: request.requester_id,
          type: `join_request_${actionText}`,
          title: `Join Request ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
          message: `Your request to join the project has been ${actionText}.`,
          data: {
            project_id: request.project_id,
            project_code: request.project_code,
            action: actionText
          }
        });

      await fetchJoinRequests();
      toast({
        title: `Request ${actionText}`,
        description: `The join request has been ${actionText} successfully.`
      });

      return true;
    } catch (error: any) {
      toast({
        title: `Error ${action === 'approve' ? 'approving' : 'rejecting'} request`,
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('project_join_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_join_requests'
      }, () => {
        fetchJoinRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchJoinRequests]);

  useEffect(() => {
    fetchJoinRequests();
  }, [fetchJoinRequests]);

  return {
    joinRequests,
    loading,
    submitJoinRequest,
    respondToJoinRequest,
    fetchJoinRequests
  };
};
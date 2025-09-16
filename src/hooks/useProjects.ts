import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Project {
  id: string;
  name: string;
  address?: string;
  created_by: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  budget?: number;
  timeline?: any;
  description?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectUser {
  id: string;
  project_id: string;
  user_id: string;
  role: 'architect' | 'builder' | 'homeowner' | 'contractor';
  permissions?: any;
  invited_by: string;
  joined_at?: string;
  created_at: string;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setProjects([]);
        return;
      }

      // Get user profile to determine role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userData.user.id)
        .single();

      let query = supabase.from('projects').select('*');

      if (profile?.role === 'homeowner') {
        // For homeowners, get projects through project_users table first
        const { data: projectUsers } = await supabase
          .from('project_users')
          .select('project_id')
          .eq('user_id', userData.user.id);
        
        const projectIds = projectUsers?.map(pu => pu.project_id) || [];
        
        if (projectIds.length > 0) {
          query = query.in('id', projectIds);
        } else {
          // If no direct project assignments, check for pending homeowner email matches
          // Use proper JSONB query syntax for nested properties
          query = query.filter('timeline->pending_homeowner->>email', 'eq', userData.user.email);
        }
      } else {
        // For architects and other roles, use the project_users relationship
        const { data: projectUsers } = await supabase
          .from('project_users')
          .select('project_id')
          .eq('user_id', userData.user.id);
        
        const projectIds = projectUsers?.map(pu => pu.project_id) || [];
        
        if (projectIds.length > 0) {
          query = query.in('id', projectIds);
        } else {
          // Return empty if no project access
          setProjects([]);
          return;
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Projects fetch error:', error);
        if (error.message.includes('infinite recursion')) {
          throw new Error('Database configuration issue detected. Please contact support.');
        }
        throw error;
      }
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error fetching projects",
        description: error.message || "Failed to load projects. Please try again.",
        variant: "destructive"
      });
      setProjects([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: {
    name: string;
    address?: string;
    budget?: number;
    description?: string;
    estimated_start_date?: string;
    estimated_finish_date?: string;
    homeowner_name?: string;
    homeowner_phone?: string;
    homeowner_email?: string;
    collaborators?: Array<{
      email: string;
      name: string;
      role: 'homeowner' | 'contractor' | 'builder';
    }>;
  }) => {
    try {
      const { collaborators, ...projectCreateData } = projectData;
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...projectCreateData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          company_id: null // Allow projects without company association
        }])
        .select()
        .single();

      if (error) throw error;

      const currentUser = (await supabase.auth.getUser()).data.user;

      // Add the creator as a project user
      await supabase
        .from('project_users')
        .insert([{
          project_id: data.id,
          user_id: currentUser?.id,
          role: 'architect',
          invited_by: currentUser?.id
        }]);

      // Handle homeowner auto-creation and linking
      if (projectData.homeowner_email) {
        await createOrLinkHomeowner(data.id, projectData.homeowner_email, projectData.homeowner_name, projectData.homeowner_phone, currentUser?.id);
      }

      // Handle collaborators - create profiles and link to project
      if (collaborators && collaborators.length > 0) {
        for (const collaborator of collaborators) {
          await createOrLinkCollaborator(data.id, collaborator, currentUser?.id);
        }
      }

      await fetchProjects();
      toast({
        title: "Project created",
        description: "Project has been created successfully"
      });
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const createOrLinkHomeowner = async (projectId: string, email: string, name?: string, phone?: string, invitedBy?: string) => {
    try {
      // Store homeowner information in project timeline for future account creation
      // When the homeowner signs up, they can be automatically linked to the project
      await supabase
        .from('projects')
        .update({ 
          timeline: { 
            pending_homeowner: {
              email,
              name: name || email.split('@')[0],
              phone,
              role: 'homeowner'
            }
          } 
        })
        .eq('id', projectId);

      toast({
        title: "Homeowner Added",
        description: `${name || email} will be notified when they create an account.`
      });
    } catch (error) {
      console.error('Error creating/linking homeowner:', error);
    }
  };

  const createOrLinkCollaborator = async (projectId: string, collaborator: { email: string; name: string; role: 'homeowner' | 'contractor' | 'builder' }, invitedBy?: string) => {
    try {
      // Store collaborator as pending invitation
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
            pending_collaborators: [...pendingCollaborators, collaborator]
          } 
        })
        .eq('id', projectId);

      toast({
        title: "Collaborator Added",
        description: `${collaborator.name} will be notified when they create an account.`
      });
    } catch (error) {
      console.error('Error creating/linking collaborator:', error);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      await fetchProjects();
      toast({
        title: "Project updated",
        description: "Project has been updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error updating project",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      // Delete project-related activities first
      const { error: activityError } = await supabase
        .from('activity_log')
        .delete()
        .eq('project_id', id);

      if (activityError) throw activityError;

      // Delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchProjects();
      toast({
        title: "Project deleted",
        description: "Project and related activities have been deleted successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error deleting project",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const inviteUserToProject = async (projectId: string, userId: string, role: 'architect' | 'builder' | 'homeowner' | 'contractor') => {
    try {
      const { error } = await supabase
        .from('project_users')
        .insert([{
          project_id: projectId,
          user_id: userId,
          role,
          invited_by: (await supabase.auth.getUser()).data.user?.id
        }]);

      if (error) throw error;

      toast({
        title: "User invited",
        description: "User has been invited to the project"
      });
    } catch (error: any) {
      toast({
        title: "Error inviting user",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const getProjectUsers = async (projectId: string) => {
    try {
      const { data, error } = await supabase
        .from('project_users')
        .select(`
          user_id,
          role,
          joined_at,
          permissions,
          profiles!inner (
            user_id,
            name,
            phone,
            avatar_url
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching project users:', error);
      toast({
        title: "Error fetching project users",
        description: error.message,
        variant: "destructive"
      });
      return [];
    }
  };

  useEffect(() => {
    fetchProjects();

    // Listen for project updates from invitation flow
    const handleProjectsUpdate = () => {
      console.log('Projects updated event received, refetching...');
      fetchProjects();
    };

    window.addEventListener('projectsUpdated', handleProjectsUpdate);
    
    return () => {
      window.removeEventListener('projectsUpdated', handleProjectsUpdate);
    };
  }, []);

  return {
    projects,
    loading,
    createProject,
    updateProject,
    deleteProject,
    inviteUserToProject,
    getProjectUsers,
    fetchProjects
  };
};
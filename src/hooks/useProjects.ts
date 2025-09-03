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
  company_id: string;
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching projects",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (projectData: {
    name: string;
    address?: string;
    budget?: number;
    description?: string;
    company_id: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...projectData,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Add the creator as a project user
      await supabase
        .from('project_users')
        .insert([{
          project_id: data.id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          role: 'architect',
          invited_by: (await supabase.auth.getUser()).data.user?.id
        }]);

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
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchProjects();
      toast({
        title: "Project deleted",
        description: "Project has been deleted successfully"
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
          *,
          profiles:user_id (
            name,
            role,
            avatar_url
          )
        `)
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
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
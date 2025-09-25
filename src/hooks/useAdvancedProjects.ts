import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdvancedProject {
  id: string;
  name: string;
  address?: string;
  description?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  budget?: number;
  estimated_start_date?: string;
  estimated_finish_date?: string;
  homeowner_name?: string;
  homeowner_phone?: string;
  homeowner_email?: string;
  additional_homeowners?: any; // JSON field from database
  created_by: string;
  created_at: string;
  updated_at: string;
  company_id?: string;
  timeline?: any;
  project_id?: string;
  project_reference_number?: string;
  // Extended fields for advanced project management
  project_type?: 'residential_new' | 'residential_renovation' | 'commercial_new' | 'commercial_renovation' | 'industrial' | 'infrastructure';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  square_footage?: number;
  number_of_floors?: number;
  completion_percentage?: number;
  weather_delays?: number;
  architectural_stage?: string;
  custom_fields?: Record<string, any>;
}

export interface ProjectMilestone {
  id: string;
  name: string;
  description?: string;
  due_date: string;
  completion_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  assigned_to?: string;
  dependencies?: string[];
  progress_percentage: number;
}

export interface ChangeOrder {
  id: string;
  title: string;
  description: string;
  cost_impact: number;
  time_impact_days: number;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  requested_by: string;
  requested_date: string;
  approved_by?: string;
  approved_date?: string;
  reason: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  project_type: string;
  default_milestones?: Omit<ProjectMilestone, 'id'>[];
  estimated_duration_days?: number;
  created_by: string;
  is_public?: boolean;
}

export interface ProjectUser {
  id: string;
  project_id: string;
  user_id: string;
  role: 'architect' | 'project_manager' | 'contractor' | 'subcontractor' | 'consultant' | 'homeowner' | 'client';
  permissions: {
    can_edit_project: boolean;
    can_manage_team: boolean;
    can_view_budget: boolean;
    can_edit_budget: boolean;
    can_approve_changes: boolean;
    can_view_documents: boolean;
    can_upload_documents: boolean;
  };
  invited_by: string;
  joined_at?: string;
  created_at: string;
}

export const useAdvancedProjects = () => {
  const [projects, setProjects] = useState<AdvancedProject[]>([]);
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    project_type: 'all',
    priority: 'all',
    assigned_team: 'all',
    date_range: 'all',
    budget_range: 'all',
    archived: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({
    field: 'updated_at',
    direction: 'desc' as 'asc' | 'desc'
  });
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
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

      let query = supabase.from('projects').select('*, project_id');

      // Apply filters based on user role
      if (profile?.role === 'homeowner') {
        const { data: projectUsers } = await supabase
          .from('project_users')
          .select('project_id')
          .eq('user_id', userData.user.id);
        
        const projectIds = projectUsers?.map(pu => pu.project_id) || [];
        
        if (projectIds.length > 0) {
          query = query.in('id', projectIds);
        } else {
          query = query.filter('timeline->pending_homeowner->>email', 'eq', userData.user.email);
        }
      } else {
        const { data: projectUsers } = await supabase
          .from('project_users')
          .select('project_id')
          .eq('user_id', userData.user.id);
        
        const projectIds = projectUsers?.map(pu => pu.project_id) || [];
        
        if (projectIds.length > 0) {
          query = query.in('id', projectIds);
        } else {
          setProjects([]);
          return;
        }
      }

      // Apply filters
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status as any);
      }

      // Apply sorting
      query = query.order(sortConfig.field, { ascending: sortConfig.direction === 'asc' });

      const { data, error } = await query;

      if (error) {
        console.error('Projects fetch error:', error);
        throw error;
      }

      // Apply client-side filtering for search and other complex filters
      let filteredData = data || [];

      if (searchQuery) {
        const lowercaseQuery = searchQuery.toLowerCase();
        filteredData = filteredData.filter(project =>
          project.name.toLowerCase().includes(lowercaseQuery) ||
          project.address?.toLowerCase().includes(lowercaseQuery) ||
          project.description?.toLowerCase().includes(lowercaseQuery) ||
          project.homeowner_name?.toLowerCase().includes(lowercaseQuery)
        );
      }

      console.log('Fetched projects data:', filteredData);
      setProjects(filteredData as AdvancedProject[]);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error fetching projects",
        description: error.message || "Failed to load projects. Please try again.",
        variant: "destructive"
      });
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery, sortConfig, toast]);

  const fetchTemplates = useCallback(async () => {
    try {
      // For now, we'll use hardcoded templates since the table doesn't exist yet
      const defaultTemplates: ProjectTemplate[] = [
        {
          id: '1',
          name: 'Residential New Build',
          description: 'Complete new residential construction project',
          project_type: 'residential_new',
          created_by: 'system',
          is_public: true
        },
        {
          id: '2', 
          name: 'Home Renovation',
          description: 'Residential renovation and remodeling project',
          project_type: 'residential_renovation',
          created_by: 'system',
          is_public: true
        }
      ];
      setTemplates(defaultTemplates);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
    }
  }, []);

  const createProject = async (projectData: Partial<AdvancedProject> & { 
    collaborators?: Array<{
      email: string;
      name: string;
      role: ProjectUser['role'];
      permissions?: Partial<ProjectUser['permissions']>;
    }>;
  }) => {
    try {
      const { collaborators, ...projectCreateData } = projectData;
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: projectCreateData.name,
          project_reference_number: projectCreateData.project_reference_number,
          address: projectCreateData.address,
          description: projectCreateData.description,
          budget: projectCreateData.budget,
          estimated_start_date: projectCreateData.estimated_start_date,
          estimated_finish_date: projectCreateData.estimated_finish_date,
          homeowner_name: projectCreateData.homeowner_name,
          homeowner_phone: projectCreateData.homeowner_phone,
          homeowner_email: projectCreateData.homeowner_email,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          status: projectCreateData.status || 'planning',
          timeline: projectCreateData.timeline || {}
        }])
        .select()
        .single();

      if (error) throw error;

      const currentUser = (await supabase.auth.getUser()).data.user;

      // Add the creator as a project user with full permissions
      await supabase
        .from('project_users')
        .insert([{
          project_id: data.id,
          user_id: currentUser?.id,
          role: 'architect',
          permissions: {
            can_edit_project: true,
            can_manage_team: true,
            can_view_budget: true,
            can_edit_budget: true,
            can_approve_changes: true,
            can_view_documents: true,
            can_upload_documents: true
          },
          invited_by: currentUser?.id
        }]);

      // Handle homeowner
      if (projectData.homeowner_email) {
        await createOrLinkHomeowner(data.id, projectData.homeowner_email, projectData.homeowner_name, projectData.homeowner_phone, currentUser?.id);
      }

      // Handle collaborators
      if (collaborators && collaborators.length > 0) {
        for (const collaborator of collaborators) {
          await inviteCollaborator(data.id, collaborator, currentUser?.id);
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

  const updateProject = async (id: string, updates: Partial<AdvancedProject>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
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

  const archiveProject = async (id: string) => {
    try {
      // For now, we'll use a soft delete by changing status
      const { error } = await supabase
        .from('projects')
        .update({ 
          status: 'cancelled'
        })
        .eq('id', id);

      if (error) throw error;

      await fetchProjects();
      toast({
        title: "Project archived",
        description: "Project has been archived successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error archiving project",
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

  const cloneProject = async (sourceProjectId: string, newName: string) => {
    try {
      // Get source project
      const { data: sourceProject, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', sourceProjectId)
        .single();

      if (fetchError) throw fetchError;

      // Create new project with cloned data
      const { name, id, created_at, updated_at, ...clonedData } = sourceProject;
      
      const newProject = await createProject({
        ...clonedData,
        name: newName,
        status: 'planning'
      });

      return newProject;
    } catch (error: any) {
      toast({
        title: "Error cloning project",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const createOrLinkHomeowner = async (projectId: string, email: string, name?: string, phone?: string, invitedBy?: string) => {
    try {
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

  const inviteCollaborator = async (projectId: string, collaborator: {
    email: string;
    name: string;
    role: ProjectUser['role'];
    permissions?: Partial<ProjectUser['permissions']>;
  }, invitedBy?: string) => {
    try {
      const defaultPermissions = {
        can_edit_project: false,
        can_manage_team: false,
        can_view_budget: true,
        can_edit_budget: false,
        can_approve_changes: false,
        can_view_documents: true,
        can_upload_documents: false
      };

      const permissions = { ...defaultPermissions, ...collaborator.permissions };

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
            pending_collaborators: [...pendingCollaborators, { ...collaborator, permissions }]
          } 
        })
        .eq('id', projectId);

      toast({
        title: "Collaborator Invited",
        description: `${collaborator.name} will be notified when they create an account.`
      });
    } catch (error) {
      console.error('Error inviting collaborator:', error);
    }
  };

  // Utility functions
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const updateSort = (field: string, direction?: 'asc' | 'desc') => {
    setSortConfig({
      field,
      direction: direction || (sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc')
    });
  };

  const getProjectsByStatus = () => {
    return projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const getProjectsByType = () => {
    return projects.reduce((acc, project) => {
      acc[project.project_type] = (acc[project.project_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const getOverdueProjects = () => {
    const now = new Date();
    return projects.filter(project => 
      project.estimated_finish_date && 
      new Date(project.estimated_finish_date) < now && 
      project.status !== 'completed'
    );
  };

  const getProjectHealth = (project: AdvancedProject) => {
    let score = 100;
    
    // Check if project is on schedule
    if (project.estimated_finish_date && new Date(project.estimated_finish_date) < new Date() && project.status !== 'completed') {
      score -= 30;
    }
    
    // Check budget variance - for now, we'll just check if budget exists
    if (project.budget && project.budget > 0) {
      // Future: implement actual vs planned budget tracking
    }
    
    // Check completion percentage vs time elapsed
    if (project.estimated_start_date && project.estimated_finish_date) {
      const totalDays = new Date(project.estimated_finish_date).getTime() - new Date(project.estimated_start_date).getTime();
      const elapsedDays = new Date().getTime() - new Date(project.estimated_start_date).getTime();
      const expectedProgress = Math.min(100, (elapsedDays / totalDays) * 100);
      
      if ((project.completion_percentage || 0) < expectedProgress - 10) {
        score -= 15;
      }
    }
    
    return Math.max(0, Math.min(100, score));
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Set up real-time subscriptions for instant updates
  useEffect(() => {
    const channels = [];

    // Subscribe to project changes
    const projectsChannel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        (payload) => {
          console.log('Project change detected:', payload);
          fetchProjects();
        }
      )
      .subscribe();

    channels.push(projectsChannel);

    // Subscribe to project_users changes (for team updates)
    const projectUsersChannel = supabase
      .channel('project-users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_users',
        },
        (payload) => {
          console.log('Project users change detected:', payload);
          fetchProjects();
        }
      )
      .subscribe();

    channels.push(projectUsersChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [fetchProjects]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    projects,
    templates,
    loading,
    filters,
    searchQuery,
    sortConfig,
    createProject,
    updateProject,
    archiveProject,
    deleteProject,
    cloneProject,
    fetchProjects,
    setSearchQuery,
    updateFilters,
    updateSort,
    getProjectsByStatus,
    getProjectsByType,
    getOverdueProjects,
    getProjectHealth,
    inviteCollaborator
  };
};
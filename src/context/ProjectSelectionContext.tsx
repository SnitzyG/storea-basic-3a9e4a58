import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useProjects, Project } from '@/hooks/useProjects';
import { supabase } from '@/integrations/supabase/client';

interface ProjectSelectionContextType {
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  availableProjects: Project[];
  loading: boolean;
}

const ProjectSelectionContext = createContext<ProjectSelectionContextType | undefined>(undefined);

interface ProjectSelectionProviderProps {
  children: ReactNode;
}

export const ProjectSelectionProvider = ({ children }: ProjectSelectionProviderProps) => {
  const { projects, loading } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [memberProjectIds, setMemberProjectIds] = useState<string[]>([]);

  // Load only projects where the user is an actual member (project_users)
  useEffect(() => {
    let mounted = true;
    const loadUserProjects = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) {
          if (mounted) setMemberProjectIds([]);
          return;
        }
        
        // Get projects where user is a member OR creator
        const { data, error } = await supabase
          .from('project_users')
          .select('project_id')
          .eq('user_id', userId);
          
        if (error) {
          console.error('Error loading user projects:', error);
          if (mounted) setMemberProjectIds([]);
          return;
        }
        
        if (mounted) {
          setMemberProjectIds((data || []).map((d) => d.project_id));
        }
      } catch (error) {
        console.error('Error in loadUserProjects:', error);
        if (mounted) setMemberProjectIds([]);
      }
    };
    
    loadUserProjects();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter available projects to member-only to avoid RLS dead views
  const availableProjects = useMemo(() => {
    if (memberProjectIds.length === 0) return [];
    // Only show projects the user is explicitly a member of
    const userProjects = projects.filter((p) => memberProjectIds.includes(p.id));
    // Sort by name for consistent UI experience
    return userProjects.sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, memberProjectIds]);

  // Auto-select first available project if none selected
  useEffect(() => {
    if (!loading && !selectedProject && availableProjects.length > 0) {
      setSelectedProject(availableProjects[0]);
    }
  }, [loading, selectedProject, availableProjects]);

  // If current selection is no longer permitted, switch to first allowed
  useEffect(() => {
    if (selectedProject && !availableProjects.find((p) => p.id === selectedProject.id)) {
      setSelectedProject(availableProjects[0] ?? null);
    }
  }, [availableProjects, selectedProject]);

  return (
    <ProjectSelectionContext.Provider 
      value={{
        selectedProject,
        setSelectedProject,
        availableProjects,
        loading
      }}
    >
      {children}
    </ProjectSelectionContext.Provider>
  );
};

export const useProjectSelection = () => {
  const context = useContext(ProjectSelectionContext);
  if (context === undefined) {
    throw new Error('useProjectSelection must be used within a ProjectSelectionProvider');
  }
  return context;
};
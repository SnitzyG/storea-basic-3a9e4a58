import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useProjects, Project } from '@/hooks/useProjects';
import { supabase } from '@/integrations/supabase/client';

interface Tender {
  id: string;
  project_id: string;
  title: string;
  status: string;
}

interface ProjectSelectionContextType {
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  availableProjects: Project[];
  selectedTender: Tender | null;
  setSelectedTender: (tender: Tender | null) => void;
  availableTenders: Tender[];
  loading: boolean;
  selectionType: 'project' | 'tender';
}

const ProjectSelectionContext = createContext<ProjectSelectionContextType | undefined>(undefined);

interface ProjectSelectionProviderProps {
  children: ReactNode;
}

export const ProjectSelectionProvider = ({ children }: ProjectSelectionProviderProps) => {
  const { projects, loading } = useProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [memberProjectIds, setMemberProjectIds] = useState<string[]>([]);
  const [availableTenders, setAvailableTenders] = useState<Tender[]>([]);
  const [selectionType, setSelectionType] = useState<'project' | 'tender'>('project');

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

  // Load tenders where user has access
  useEffect(() => {
    let mounted = true;
    const loadUserTenders = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;
        if (!userId) {
          if (mounted) setAvailableTenders([]);
          return;
        }

        // Get tenders where user is project member, issuer, or has tender access
        const { data, error } = await supabase
          .from('tenders')
          .select('id, project_id, title, status')
          .or(`issued_by.eq.${userId},project_id.in.(${memberProjectIds.join(',')})`);

        if (error) {
          console.error('Error loading tenders:', error);
          if (mounted) setAvailableTenders([]);
          return;
        }

        if (mounted) {
          setAvailableTenders((data || []) as Tender[]);
        }
      } catch (error) {
        console.error('Error in loadUserTenders:', error);
        if (mounted) setAvailableTenders([]);
      }
    };

    if (memberProjectIds.length > 0) {
      loadUserTenders();
    }
  }, [memberProjectIds]);

  // Auto-select first available project if none selected and no tender selected
  useEffect(() => {
    if (!loading && !selectedProject && !selectedTender && availableProjects.length > 0) {
      setSelectedProject(availableProjects[0]);
      setSelectionType('project');
    }
  }, [loading, selectedProject, selectedTender, availableProjects]);

  // If current selection is no longer permitted, switch to first allowed
  useEffect(() => {
    if (selectedProject && !availableProjects.find((p) => p.id === selectedProject.id)) {
      setSelectedProject(availableProjects[0] ?? null);
    }
  }, [availableProjects, selectedProject]);

  // Custom setter that handles selection type
  const handleSetProject = (project: Project | null) => {
    setSelectedProject(project);
    if (project) {
      setSelectedTender(null);
      setSelectionType('project');
    }
  };

  const handleSetTender = (tender: Tender | null) => {
    setSelectedTender(tender);
    if (tender) {
      setSelectedProject(null);
      setSelectionType('tender');
    }
  };

  return (
    <ProjectSelectionContext.Provider 
      value={{
        selectedProject,
        setSelectedProject: handleSetProject,
        availableProjects,
        selectedTender,
        setSelectedTender: handleSetTender,
        availableTenders,
        loading,
        selectionType
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
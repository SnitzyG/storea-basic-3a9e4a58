import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useProjects, Project } from '@/hooks/useProjects';
import { supabase } from '@/integrations/supabase/client';

interface Tender {
  id: string;
  project_id: string;
  tender_id: string;
  title: string;
  description?: string;
  status: string;
  deadline: string;
  budget?: number;
  issued_by: string;
  issued_by_profile?: {
    name: string;
    role: string;
  };
  created_at: string;
  updated_at: string;
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
  const loadUserProjects = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setMemberProjectIds([]);
        return;
      }

      // Get projects where user is a member OR creator
      const { data, error } = await supabase
        .from('project_users')
        .select('project_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error loading user projects:', error);
        setMemberProjectIds([]);
        return;
      }

      setMemberProjectIds((data || []).map((d) => d.project_id));
    } catch (error) {
      console.error('Error in loadUserProjects:', error);
      setMemberProjectIds([]);
    }
  };

  useEffect(() => {
    loadUserProjects();
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
  const loadUserTenders = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        setAvailableTenders([]);
        return;
      }

      // Simplified Local Fetch: Get ALL tenders and filter in memory
      // This is safe because it's a local mock DB with limited data
      const { data: allTenders } = await supabase.from('tenders').select('*');

      // Get Access records
      const { data: accessRecords } = await supabase
        .from('tender_access')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'approved');

      const approvedTenderIds = new Set(accessRecords?.map((a: any) => a.tender_id) || []);

      // Filter logic:
      // 1. Issued by user
      // 2. Belongs to a project user is a member of
      // 3. Explicitly approved access
      const memberProjParams = new Set(memberProjectIds);

      const visibleTenders = (allTenders || []).filter((t: Tender) => {
        const isIssuer = t.issued_by === userId;
        const isProjectMember = memberProjParams.has(t.project_id);
        const hasDirectAccess = approvedTenderIds.has(t.id);

        return isIssuer || isProjectMember || hasDirectAccess;
      });

      // Fetch user profiles for issuers
      const issuerIds = [...new Set(visibleTenders.map((t: any) => t.issued_by).filter(Boolean))];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, role')
        .in('user_id', issuerIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

      // Enrich tenders
      const enrichedTenders = visibleTenders.map((t: any) => ({
        ...t,
        issued_by_profile: profileMap.get(t.issued_by)
      }));

      console.log('[ProjectSelectionContext] Loaded', enrichedTenders.length, 'tenders');
      setAvailableTenders(enrichedTenders as Tender[]);

    } catch (error) {
      console.error('Error in loadUserTenders:', error);
      setAvailableTenders([]);
    }
  };

  useEffect(() => {
    loadUserTenders();
  }, [memberProjectIds]);

  // Auto-select first available project OR tender if none selected
  useEffect(() => {
    if (!loading && !selectedProject && !selectedTender) {
      if (availableProjects.length > 0) {
        setSelectedProject(availableProjects[0]);
        setSelectionType('project');
      } else if (availableTenders.length > 0) {
        // Auto-select first tender if no projects available
        setSelectedTender(availableTenders[0]);
        setSelectionType('tender');
      }
    }
  }, [loading, selectedProject, selectedTender, availableProjects, availableTenders]);

  // If current selection is no longer permitted, switch to first allowed
  useEffect(() => {
    if (selectedProject && !availableProjects.find((p) => p.id === selectedProject.id)) {
      setSelectedProject(availableProjects[0] ?? null);
    }
    if (selectedTender && !availableTenders.find((t) => t.id === selectedTender.id)) {
      setSelectedTender(availableTenders[0] ?? null);
    }
  }, [availableProjects, selectedProject, availableTenders, selectedTender]);

  // Real-time event listeners for instant updates
  useEffect(() => {
    const handleProjectChange = () => {
      console.log('[ProjectSelectionContext] Project change detected, reloading...');
      loadUserProjects();
    };

    const handleProjectUserChange = () => {
      console.log('[ProjectSelectionContext] Project membership change detected, reloading...');
      loadUserProjects();
    };

    const handleTenderChange = () => {
      console.log('[ProjectSelectionContext] Tender change detected, reloading...');
      loadUserTenders();
    };

    // Listen to global real-time events from useGlobalRealtime
    window.addEventListener('supabase:projects:change', handleProjectChange);
    window.addEventListener('supabase:project_users:change', handleProjectUserChange);
    window.addEventListener('supabase:tenders:change', handleTenderChange);
    window.addEventListener('supabase:tender_bids:change', handleTenderChange);

    return () => {
      window.removeEventListener('supabase:projects:change', handleProjectChange);
      window.removeEventListener('supabase:project_users:change', handleProjectUserChange);
      window.removeEventListener('supabase:tenders:change', handleTenderChange);
      window.removeEventListener('supabase:tender_bids:change', handleTenderChange);
    };
  }, []);

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
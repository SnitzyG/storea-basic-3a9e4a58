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

        // Get tenders where user has approved tender_access  
        const client = supabase as any;
        client
          .from('tender_access')
          .select('tender_id')
          .eq('user_id', userId)
          .eq('status', 'approved')
          .then(async (accessResult: any) => {
            const approvedTenderIds: string[] = accessResult.data 
              ? accessResult.data.map((a: any) => a.tender_id)
              : [];
            
            // Get tenders where user is issuer or project member
            const orCondition = memberProjectIds.length > 0 
              ? `issued_by.eq.${userId},project_id.in.(${memberProjectIds.join(',')})`
              : `issued_by.eq.${userId}`;
              
            const [ownedResult, accessResult2] = await Promise.all([
              client
                .from('tenders')
                .select('*')
                .or(orCondition),
              approvedTenderIds.length > 0
                ? client
                    .from('tenders')
                    .select('*')
                    .in('id', approvedTenderIds)
                : Promise.resolve({ data: [] })
            ]);

            // Combine and deduplicate tenders
            const allTenders = [...(ownedResult.data || []), ...(accessResult2.data || [])];
            const tenderMap: Record<string, any> = {};
            allTenders.forEach((t: any) => {
              tenderMap[t.id] = t;
            });
            const uniqueTendersData = Object.values(tenderMap);

            // Fetch user profiles for tender issuers
            const userIds = [...new Set(uniqueTendersData.map((t: any) => t.issued_by).filter(Boolean))];
            
            const { data: profiles } = await supabase
              .from('profiles')
              .select('user_id, name, role')
              .in('user_id', userIds);

            const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

            // Enrich tenders with profile data
            const enrichedTenders = uniqueTendersData.map((t: any) => ({
              ...t,
              issued_by_profile: profileMap.get(t.issued_by)
            }));

            console.log('[ProjectSelectionContext] Loaded', enrichedTenders.length, 'tenders:', enrichedTenders);

            if (mounted) {
              setAvailableTenders(enrichedTenders as Tender[]);
            }
          });
      } catch (error) {
        console.error('Error in loadUserTenders:', error);
        if (mounted) setAvailableTenders([]);
      }
    };

    loadUserTenders();
    
    return () => {
      mounted = false;
    };
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
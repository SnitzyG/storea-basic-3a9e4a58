import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useProjects, Project } from '@/hooks/useProjects';

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

  // Auto-select first project if none selected and projects are available
  useEffect(() => {
    if (!selectedProject && projects.length > 0 && !loading) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject, loading]);

  return (
    <ProjectSelectionContext.Provider 
      value={{
        selectedProject,
        setSelectedProject,
        availableProjects: projects,
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
import { useState, useEffect } from 'react';
import { useProjects } from '@/hooks/useProjects';

export const useProjectSwitcher = () => {
  const { projects } = useProjects();
  const [currentProject, setCurrentProject] = useState<string | null>(null);

  useEffect(() => {
    // Set the first project as current if none is selected
    if (projects.length > 0 && !currentProject) {
      setCurrentProject(projects[0].id);
    }
  }, [projects, currentProject]);

  const switchProject = (projectId: string) => {
    setCurrentProject(projectId);
  };

  const getCurrentProject = () => {
    return projects.find(p => p.id === currentProject);
  };

  return {
    currentProject,
    switchProject,
    getCurrentProject,
    projects
  };
};
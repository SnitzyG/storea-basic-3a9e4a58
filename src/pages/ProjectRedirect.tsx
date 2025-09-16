import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

export const ProjectRedirect = () => {
  const { projectId } = useParams();

  useEffect(() => {
    if (projectId) {
      // Immediately redirect to external domain
      window.location.href = `https://www.storea.com.au/${projectId}`;
    }
  }, [projectId]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to project...</p>
      </div>
    </div>
  );
};

export default ProjectRedirect;
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectLinking } from '@/hooks/useProjectLinking';

export const ProjectLinkingHandler = () => {
  const { user, profile } = useAuth();

  // Use the project linking hook when user and profile are available
  useProjectLinking();

  return null; // This component doesn't render anything
};
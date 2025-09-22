import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useProjectLinking = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const hasRunRef = useRef(false);

  useEffect(() => {
    const linkUserToProjects = async () => {
      if (!user || !profile || !user.email || hasRunRef.current) return;

      hasRunRef.current = true;

      try {
        // Call the edge function to handle project linking
        const { data, error } = await supabase.functions.invoke('link-pending-projects');

        if (error) {
          console.error('Error linking user to projects:', error);
          // Reset flag on error to allow retry
          hasRunRef.current = false;
        } else {
          console.log('Successfully checked for project linkings:', data);
          
          // Show toast if projects were linked
          if (data?.projectsLinked > 0) {
            toast({
              title: "Welcome to the team!",
              description: `You've been automatically added to ${data.projectsLinked} project(s)!`
            });
            
            // Dispatch custom event to refresh projects and team data
            window.dispatchEvent(new CustomEvent('projectsUpdated'));
            window.dispatchEvent(new CustomEvent('teamMembersUpdated'));
          }
        }
      } catch (error) {
        console.error('Error in project linking hook:', error);
        // Reset flag on error to allow retry
        hasRunRef.current = false;
      }
    };

    // Only run this once when user profile is loaded
    if (user && profile) {
      linkUserToProjects();
    }
  }, [user, profile, toast]); // Only run when user or profile changes

  return null; // This hook doesn't return anything, just handles side effects
};
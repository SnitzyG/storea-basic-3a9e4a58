import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useProjectLinking = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const linkUserToProjects = async () => {
      if (!user || !profile || !user.email) return;

      try {
        // Call the edge function to handle project linking
        const { data, error } = await supabase.functions.invoke('link-pending-projects');

        if (error) {
          console.error('Error linking user to projects:', error);
        } else {
          console.log('Successfully checked for project linkings:', data);
          
          // Show toast if projects were linked
          if (data?.projectsLinked > 0) {
            toast({
              title: "Project Access Granted",
              description: `You've been automatically linked to ${data.projectsLinked} project(s)!`
            });
            
            // Delay reload to show toast first
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Error in project linking hook:', error);
      }
    };

    // Only run this once when user profile is loaded
    if (user && profile) {
      linkUserToProjects();
    }
  }, [user, profile, toast]); // Only run when user or profile changes

  return null; // This hook doesn't return anything, just handles side effects
};
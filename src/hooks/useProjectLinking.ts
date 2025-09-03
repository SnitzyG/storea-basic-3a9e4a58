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
        // Use the database function to handle all project linking
        const { error } = await supabase.rpc('link_pending_users_to_projects', {
          user_email: user.email,
          target_user_id: user.id
        });

        if (error) {
          console.error('Error linking user to projects:', error);
        } else {
          // Refresh projects after linking
          console.log('Successfully checked for project linkings');
        }
      } catch (error) {
        console.error('Error in project linking hook:', error);
      }
    };

    // Only run this once when user profile is loaded
    if (user && profile) {
      linkUserToProjects();
    }
  }, [user, profile]); // Only run when user or profile changes

  return null; // This hook doesn't return anything, just handles side effects
};
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
        // Check for projects where this user's email is in pending_homeowner
        const { data: projects } = await supabase
          .from('projects')
          .select('id, timeline')
          .like('timeline', `%"email":"${user.email}"%`);

        if (projects && projects.length > 0) {
          for (const project of projects) {
            const timeline = project.timeline as any;
            const pendingHomeowner = timeline?.pending_homeowner;
            
            if (pendingHomeowner?.email === user.email) {
              // Link this user to the project
              const { error: linkError } = await supabase
                .from('project_users')
                .insert([{
                  project_id: project.id,
                  user_id: user.id,
                  role: 'homeowner',
                  invited_by: null, // Will be set by the system
                  joined_at: new Date().toISOString()
                }]);

              if (!linkError) {
                // Remove from pending and update timeline
                const updatedTimeline = { ...timeline };
                delete updatedTimeline.pending_homeowner;
                
                await supabase
                  .from('projects')
                  .update({ timeline: updatedTimeline })
                  .eq('id', project.id);

                toast({
                  title: "Project Access Granted",
                  description: "You've been automatically linked to your assigned project!"
                });
              }
            }
          }
        }

        // Check for projects where this user's email is in pending_collaborators
        const { data: collaboratorProjects } = await supabase
          .from('projects')
          .select('id, timeline')
          .like('timeline', `%"email":"${user.email}"%`);

        if (collaboratorProjects && collaboratorProjects.length > 0) {
          for (const project of collaboratorProjects) {
            const timeline = project.timeline as any;
            const pendingCollaborators = timeline?.pending_collaborators || [];
            
            const matchingCollaborator = pendingCollaborators.find(
              (collab: any) => collab.email === user.email
            );

            if (matchingCollaborator) {
              // Link this user to the project
              const { error: linkError } = await supabase
                .from('project_users')
                .insert([{
                  project_id: project.id,
                  user_id: user.id,
                  role: matchingCollaborator.role,
                  invited_by: null,
                  joined_at: new Date().toISOString()
                }]);

              if (!linkError) {
                // Remove from pending collaborators
                const updatedCollaborators = pendingCollaborators.filter(
                  (collab: any) => collab.email !== user.email
                );
                
                const updatedTimeline = {
                  ...timeline,
                  pending_collaborators: updatedCollaborators
                };
                
                await supabase
                  .from('projects')
                  .update({ timeline: updatedTimeline })
                  .eq('id', project.id);

                toast({
                  title: "Project Access Granted",
                  description: `You've been automatically linked to the project as a ${matchingCollaborator.role}!`
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error linking user to projects:', error);
      }
    };

    // Only run this once when user profile is loaded
    if (user && profile) {
      linkUserToProjects();
    }
  }, [user, profile]); // Only run when user or profile changes

  return null; // This hook doesn't return anything, just handles side effects
};
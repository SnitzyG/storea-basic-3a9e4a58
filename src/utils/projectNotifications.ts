import { supabase } from '@/integrations/supabase/client';

export const createMemberJoinedNotification = async (
  projectId: string,
  projectName: string,
  newMemberName: string,
  newMemberRole: string,
  projectCreatorId: string
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: projectCreatorId,
        type: 'team_member_joined',
        title: 'New Team Member Joined',
        message: `${newMemberName} has joined "${projectName}" as a ${newMemberRole}.`,
        data: {
          project_id: projectId,
          project_name: projectName,
          member_name: newMemberName,
          member_role: newMemberRole,
          action_url: `/projects`
        }
      });

    if (error) {
      console.error('Error creating member joined notification:', error);
    }
  } catch (error) {
    console.error('Failed to create member joined notification:', error);
  }
};
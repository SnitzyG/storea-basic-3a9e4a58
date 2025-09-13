import { supabase } from '@/integrations/supabase/client';

export interface WelcomeNotificationData {
  projectId: string;
  projectName: string;
  role: string;
  inviterName: string;
}

export const createWelcomeNotification = async (
  userId: string, 
  data: WelcomeNotificationData
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'team_welcome',
        title: '🎉 Welcome to the team!',
        message: `You've successfully joined "${data.projectName}" as a ${data.role}. Start collaborating with ${data.inviterName} and other team members.`,
        data: {
          project_id: data.projectId,
          project_name: data.projectName,
          role: data.role,
          inviter_name: data.inviterName,
          action_url: `/projects/${data.projectId}`
        }
      });

    if (error) {
      console.error('Error creating welcome notification:', error);
    }
  } catch (error) {
    console.error('Failed to create welcome notification:', error);
  }
};

export const createInvitationSentNotification = async (
  inviterId: string,
  email: string,
  projectName: string
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: inviterId,
        type: 'invitation_sent',
        title: '📧 Invitation sent',
        message: `Team invitation sent to ${email} for "${projectName}". They will receive an email with instructions to join.`,
        data: {
          email,
          project_name: projectName
        }
      });

    if (error) {
      console.error('Error creating invitation notification:', error);
    }
  } catch (error) {
    console.error('Failed to create invitation notification:', error);
  }
};
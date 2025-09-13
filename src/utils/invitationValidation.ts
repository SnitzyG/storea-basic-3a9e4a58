import { supabase } from '@/integrations/supabase/client';

export interface InvitationValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
}

export const validateInvitationRequest = async (
  projectId: string,
  email: string,
  role: string,
  currentUserId: string
): Promise<InvitationValidationResult> => {
  try {
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        isValid: false,
        error: 'Invalid email format',
        suggestion: 'Please enter a valid email address (e.g., user@example.com)'
      };
    }

    // Check if user is project creator/admin
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('created_by, name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return {
        isValid: false,
        error: 'Project not found',
        suggestion: 'Please make sure you have access to this project'
      };
    }

    if (project.created_by !== currentUserId) {
      return {
        isValid: false,
        error: 'Permission denied',
        suggestion: 'Only project creators can invite team members'
      };
    }

    // Check if inviting self
    const { data: currentUserAuth } = await supabase.auth.getUser();
    if (currentUserAuth.user?.email === email) {
      return {
        isValid: false,
        error: 'Cannot invite yourself',
        suggestion: 'You are already the project creator'
      };
    }

    // Check for existing team members
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingUser = authUsers?.users?.find((u: any) => u.email === email);
    
    if (existingUser) {
      const { data: isTeamMember } = await supabase
        .from('project_users')
        .select('id, role')
        .eq('project_id', projectId)
        .eq('user_id', existingUser.id)
        .single();

      if (isTeamMember) {
        return {
          isValid: false,
          error: 'User is already a team member',
          suggestion: `This user is already part of the project as a ${isTeamMember.role}`
        };
      }
    }

    // Check for pending invitations
    const { data: existingInvitation } = await supabase
      .from('project_pending_invitations')
      .select('id, role, created_at')
      .eq('project_id', projectId)
      .eq('email', email)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingInvitation) {
      const inviteAge = Math.floor((Date.now() - new Date(existingInvitation.created_at).getTime()) / (1000 * 60));
      return {
        isValid: false,
        error: 'Invitation already sent',
        suggestion: `An invitation was sent to this email ${inviteAge} minutes ago. Check the pending invitations to resend if needed.`
      };
    }

    // Validate role
    const validRoles = ['architect', 'builder', 'contractor', 'client', 'consultant', 'project_manager', 'homeowner'];
    if (!validRoles.includes(role)) {
      return {
        isValid: false,
        error: 'Invalid role',
        suggestion: `Please select a valid role: ${validRoles.join(', ')}`
      };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Validation error:', error);
    return {
      isValid: false,
      error: 'Validation failed',
      suggestion: 'Please try again or contact support if the problem persists'
    };
  }
};

export const getDuplicateCheckSuggestion = (email: string, projectName: string): string => {
  const suggestions = [
    `Check if ${email} might already have access to "${projectName}"`,
    'Verify the email address spelling is correct',
    'Consider checking with the person if they received a previous invitation',
    'Look in the pending invitations list to see if an invite was already sent'
  ];
  
  return suggestions[Math.floor(Math.random() * suggestions.length)];
};
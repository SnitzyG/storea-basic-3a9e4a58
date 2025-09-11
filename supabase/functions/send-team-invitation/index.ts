import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  projectId: string;
  email: string;
  role: string;
  projectName: string;
  inviterName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { projectId, email, role, projectName, inviterName }: InvitationRequest = await req.json();

    // Validate input
    if (!projectId || !email || !role || !projectName) {
      throw new Error('Missing required fields');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    // Check if user is project creator/admin
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('created_by')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    if (project.created_by !== user.id) {
      throw new Error('Only project creators can invite team members');
    }

    // Check if email is already a team member
    const { data: existingMember } = await supabase
      .from('project_users')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    // Check by email in auth.users for existing users
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const existingUser = authUsers?.users?.find((u: any) => u.email === email);
    
    if (existingUser) {
      // Check if already a team member
      const { data: isTeamMember } = await supabase
        .from('project_users')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', existingUser.id)
        .single();

      if (isTeamMember) {
        return new Response(
          JSON.stringify({ error: 'User is already a team member' }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabase
      .from('project_pending_invitations')
      .select('id')
      .eq('project_id', projectId)
      .eq('email', email)
      .single();

    if (existingInvitation) {
      return new Response(
        JSON.stringify({ error: 'Invitation already sent to this email' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Generate unique invitation token
    const invitationToken = crypto.randomUUID();

    // Store pending invitation
    const { error: invitationError } = await supabase
      .from('project_pending_invitations')
      .insert({
        project_id: projectId,
        email: email,
        role: role,
        invited_by: user.id,
        invitation_token: invitationToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      throw new Error('Failed to create invitation');
    }

    // Create invitation link
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://inibugusrzfihldvegrb.lovableproject.com';
    const invitationLink = `${frontendUrl}/accept-invitation?token=${invitationToken}`;

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "Team Collaboration <noreply@resend.dev>",
      to: [email],
      subject: `You've been invited to join "${projectName}"`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #007bff; padding-bottom: 20px;">
            <h1 style="color: #333; margin: 0; font-size: 28px;">🏗️ Project Team Invitation</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #007bff;">
            <h2 style="color: #495057; margin-top: 0; font-size: 22px;">You're invited to join a project!</h2>
            <p style="color: #6c757d; line-height: 1.8; font-size: 16px; margin: 15px 0;">
              <strong style="color: #007bff;">${inviterName}</strong> has invited you to join the project 
              <strong style="color: #007bff;">"${projectName}"</strong> as a 
              <strong style="color: #28a745;">${role.charAt(0).toUpperCase() + role.slice(1)}</strong>.
            </p>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="${invitationLink}" 
               style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3); transition: all 0.3s ease;">
              ✅ Accept Invitation
            </a>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #dee2e6;">
            <h3 style="color: #495057; margin-top: 0; font-size: 18px;">📋 What happens next?</h3>
            <ul style="color: #6c757d; line-height: 1.6; padding-left: 20px;">
              <li>Click the button above to create your account (or sign in if you already have one)</li>
              <li>You'll automatically join the "${projectName}" project team</li>
              <li>Start collaborating with ${inviterName} and other team members immediately</li>
            </ul>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>⏰ Important:</strong> This invitation will expire in 7 days. 
              Don't miss out on being part of this project!
            </p>
          </div>

          <hr style="border: 1px solid #dee2e6; margin: 30px 0;">
          
          <div style="text-align: center; color: #6c757d; font-size: 12px; line-height: 1.5;">
            <p style="margin: 10px 0;">
              Having trouble with the button? Copy and paste this link into your browser:
            </p>
            <p style="background: #f8f9fa; padding: 8px; border-radius: 4px; word-break: break-all; font-family: monospace; border: 1px solid #dee2e6;">
              ${invitationLink}
            </p>
            <p style="margin: 15px 0 0 0; color: #888;">
              This email was sent by the project collaboration platform. 
              If you weren't expecting this invitation, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error("Error sending email:", emailResponse.error);
      
      // If email fails, remove the pending invitation and return error
      await supabase
        .from('project_pending_invitations')
        .delete()
        .eq('invitation_token', invitationToken);
        
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send invitation email. Please check the email address and try again.',
          details: emailResponse.error
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Team invitation sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation sent to ${email}`,
        invitationId: invitationToken
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-team-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
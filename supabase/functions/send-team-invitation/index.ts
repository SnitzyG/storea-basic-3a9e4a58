import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Team invitation function called');
    
    const { projectId, email, role, projectName, inviterName } = await req.json();
    console.log('Team invitation request:', { projectId, email, role, projectName, inviterName });

    // Validate required fields
    if (!projectId || !email || !role || !projectName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user from the request token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create or refresh pending invitation (avoid duplicates)
    // Check for existing pending invitation
    const { data: existingInvite, error: existingInviteError } = await supabase
      .from('invitations')
      .select('id')
      .eq('project_id', projectId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInviteError) {
      console.error('Error checking existing invitation:', existingInviteError);
    }

    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    if (existingInvite) {
      const { error: updateInviteError } = await supabase
        .from('invitations')
        .update({
          token: invitationToken,
          expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
          status: 'pending'
        })
        .eq('id', existingInvite.id);

      if (updateInviteError) {
        console.error('Error refreshing invitation:', updateInviteError);
        return new Response(
          JSON.stringify({ error: 'Failed to refresh invitation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          project_id: projectId,
          email: email.toLowerCase(),
          role: role,
          token: invitationToken,
          inviter_id: user.id,
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        });

      if (inviteError) {
        console.error('Error creating invitation:', inviteError);
        return new Response(
          JSON.stringify({ error: 'Failed to create invitation' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured',
          isConfigurationIssue: true 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const resend = new Resend(resendApiKey);
    const invitationLink = `${Deno.env.get('SITE_URL')}/accept-invitation?token=${invitationToken}`;

    try {
      const emailResponse = await resend.emails.send({
        from: 'ID Platform <noreply@resend.dev>',
        to: [email],
        subject: `You've been invited to join ${projectName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #333; margin-bottom: 20px;">Project Invitation</h1>
            
            <p style="font-size: 16px; line-height: 1.5; color: #555;">
              Hi there!
            </p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #555;">
              <strong>${inviterName || 'Someone'}</strong> has invited you to join the project "<strong>${projectName}</strong>" as a <strong>${role}</strong>.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">What you'll get access to:</h3>
              <ul style="color: #555;">
                <li>Project documents and files</li>
                <li>Team communications and messages</li>
                <li>RFI (Request for Information) management</li>
                <li>Tender processes and bidding</li>
                <li>Real-time project updates</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Accept Invitation
              </a>
            </div>
            
            <p style="font-size: 14px; color: #777; margin-top: 30px;">
              This invitation will expire in 7 days. If you're unable to click the button above, 
              you can copy and paste this link into your browser:<br>
              <a href="${invitationLink}" style="color: #007bff;">${invitationLink}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="font-size: 12px; color: #999;">
              This email was sent by the ID Platform. If you weren't expecting this invitation, 
              you can safely ignore this email.
            </p>
          </div>
        `,
      });

      console.log('Email sent successfully:', emailResponse);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Invitation sent successfully',
          method: 'resend'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (emailError) {
      console.error('Error sending email with Resend:', emailError);
      
      // If email failed, clean up the invitation
      await supabase
        .from('invitations')
        .delete()
        .eq('token', invitationToken);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to send invitation email',
          details: emailError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in send-team-invitation function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
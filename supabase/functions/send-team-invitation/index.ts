import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";
import { Resend } from "npm:resend@2.0.0";

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

    // Initialize Supabase admin client for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get current user from the request token using regular client
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabasePublic = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { data: { user }, error: authError } = await supabasePublic.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for existing pending invitation to avoid duplicates
    const { data: existingInvite, error: existingInviteError } = await supabaseAdmin
      .from('invitations')
      .select('id, status')
      .eq('project_id', projectId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (existingInviteError) {
      console.error('Error checking existing invitation:', existingInviteError);
    }

    if (existingInvite) {
      return new Response(
        JSON.stringify({ 
          error: 'An active invitation has already been sent to this email address',
          duplicate: true 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store project and role info in user metadata for the invite
    const userMetadata = {
      project_id: projectId,
      project_name: projectName,
      role: role,
      inviter_name: inviterName || 'Team Member'
    };

    // VERIFY IN SUPABASE DASHBOARD: Auth > SMTP > Enable Custom SMTP
    // Host: smtp.resend.com, Port: 465 (SSL) or 587 (TLS), User: 'resend', Pass: RESEND_API_KEY
    // Sender: no-reply@yourdomain.com. Test via dashboard.
    const redirectUrl = `${Deno.env.get('SITE_URL')}/projects/${projectId}/join?role=${role}&projectId=${projectId}`;
    
    console.log('Attempting Supabase admin.inviteUserByEmail with:', { 
      email: email.toLowerCase(), 
      redirectUrl, 
      metadata: userMetadata 
    });
    
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      email.toLowerCase(),
      {
        redirectTo: redirectUrl,
        data: userMetadata // This metadata will be available in the auth flow
      }
    );

    // Log full response for debugging
    console.log('Supabase invitation response:', { 
      success: !!inviteData && !inviteError, 
      error: inviteError?.message, 
      token: inviteData?.user?.confirmation_sent_at,
      user_id: inviteData?.user?.id 
    });

    // If Supabase SMTP fails, fallback to direct Resend API
    if (inviteError) {
      console.warn('Supabase invitation failed, attempting Resend fallback:', inviteError.message);
      
      try {
        const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
        const fallbackResponse = await resend.emails.send({
          from: 'no-reply@yourdomain.com', // TODO: Configure your domain
          to: [email.toLowerCase()],
          subject: `Join Project Invitation - ${projectName}`,
          html: `
            <h2>You're invited to join ${projectName}</h2>
            <p>Hi! You've been invited to join the project "${projectName}" as a <strong>${role}</strong>.</p>
            ${userMetadata.inviter_name ? `<p>Invited by: ${userMetadata.inviter_name}</p>` : ''}
            <p><a href="${redirectUrl}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invite</a></p>
            <p><small>This invitation expires in 7 days.</small></p>
          `
        });
        
        console.log('Resend fallback response:', fallbackResponse);
        
        if (fallbackResponse.data) {
          console.log('Fallback email sent successfully via Resend');
          // Continue with invitation record creation below
        } else {
          throw new Error('Resend API failed');
        }
      } catch (resendError) {
        console.error('Both Supabase and Resend failed:', resendError);
        return new Response(
          JSON.stringify({ 
            error: 'Email delivery failed - check Supabase SMTP config and Resend API key',
            details: `Supabase: ${inviteError.message}, Resend: ${resendError.message}` 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      console.log('Supabase invitation sent successfully:', inviteData);
    }

    // Create invitation record for tracking
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { error: recordError } = await supabaseAdmin
      .from('invitations')
      .insert({
        project_id: projectId,
        email: email.toLowerCase(),
        role: role,
        token: inviteData.user?.id || crypto.randomUUID(), // Use user ID or fallback
        inviter_id: user.id,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      });

    if (recordError) {
      console.warn('Failed to create invitation record (email still sent):', recordError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation sent successfully via Supabase magic link',
        method: 'supabase_admin_invite'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-team-invitation function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
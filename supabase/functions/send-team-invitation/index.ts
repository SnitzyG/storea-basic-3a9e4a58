import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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

    // Use Supabase's native auth invite system
    const redirectUrl = `${Deno.env.get('SITE_URL')}/projects/${projectId}/join?role=${role}&projectId=${projectId}`;
    
    console.log('Sending Supabase admin.inviteUserByEmail:', { 
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

    // Log response for debugging
    console.log('Supabase invitation response:', { 
      success: !!inviteData && !inviteError, 
      error: inviteError?.message, 
      token: inviteData?.user?.confirmation_sent_at,
      user_id: inviteData?.user?.id,
      user_email: inviteData?.user?.email,
      user_email_confirmed_at: inviteData?.user?.email_confirmed_at,
      invite_sent_at: inviteData?.user?.invite_sent_at
    });

    if (inviteError) {
      console.error('Supabase invitation failed:', inviteError.message);
      console.error('Full error details:', inviteError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send invitation email',
          details: inviteError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Supabase invitation sent successfully:', inviteData);

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
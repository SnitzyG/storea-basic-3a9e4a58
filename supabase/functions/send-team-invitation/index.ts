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
    console.log('📨 Team invitation function called');
    
    const { projectId, email, role, projectName, inviterName } = await req.json();
    console.log('📨 Sending project invite:', { projectId, email, role, projectName, inviterName });

    // Validate required fields
    if (!projectId || !email || !role || !projectName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get current user from the request token for validation
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
    const { data: existingInvite, error: existingInviteError } = await supabase
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

    // Supabase will automatically send invitation email and handle new vs existing users
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email.toLowerCase(), {
      data: {
        projectId,
        role,
        projectName,
        inviterName: inviterName || 'Team Member',
      },
      redirectTo: `${Deno.env.get('SITE_URL')}/projects/${projectId}/join?role=${role}&projectId=${projectId}`
    });

    if (error) {
      console.error('❌ Error inviting user:', error.message);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send invitation email',
          details: error.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Supabase invitation sent successfully:', data);

    // Create invitation record for tracking
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { error: recordError } = await supabase
      .from('invitations')
      .insert({
        project_id: projectId,
        email: email.toLowerCase(),
        role: role,
        token: data.user?.id || crypto.randomUUID(),
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
        message: 'Invitation sent successfully via Supabase built-in mailer',
        user: data
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('💥 Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: (err as Error).message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
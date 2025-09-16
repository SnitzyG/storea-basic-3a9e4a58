import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      throw new Error('Server configuration error');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { projectId } = await req.json();
    console.log('Regenerating invite link for project:', projectId);

    if (!projectId) {
      console.error('Missing projectId in request');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing projectId' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate a new token using the database function
    const { data: tokenResult, error: tokenError } = await supabase
      .rpc('generate_project_invitation_token');

    if (tokenError) {
      console.error('Token generation error:', tokenError);
      throw new Error(`Token generation failed: ${tokenError.message}`);
    }

    if (!tokenResult) {
      console.error('No token returned from function');
      throw new Error('Token generation returned null');
    }

    console.log('Generated new token:', tokenResult);

    // Update the project with the new token
    const { data, error } = await supabase
      .from('projects')
      .update({ invitation_token: tokenResult })
      .eq('id', projectId)
      .select('id, invitation_token')
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw new Error(`Database update failed: ${error.message}`);
    }

    if (!data) {
      console.error('No data returned from update');
      throw new Error('Project not found or update failed');
    }

    console.log('Updated project with token:', data);

    // Build the final link
    const origin = req.headers.get('origin') || `${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}`;
    const inviteUrl = `${origin}/invite/${data.invitation_token}`;

    console.log('Generated invite URL:', inviteUrl);

    return new Response(
      JSON.stringify({ 
        success: true,
        link: inviteUrl,
        token: data.invitation_token
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    console.error('Edge function error:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
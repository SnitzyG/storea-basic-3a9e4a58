import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { projectId } = await req.json();
    
    console.log('Generating invite link for project:', projectId);

    if (!projectId) {
      return new Response(JSON.stringify({ error: 'Missing projectId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call the SQL function to generate a token
    const { data: tokenResult, error: tokenError } = await supabase
      .rpc('generate_project_invitation_token');

    if (tokenError || !tokenResult) {
      console.error('Token generation error:', tokenError);
      throw tokenError || new Error('Failed to generate token');
    }

    console.log('Generated token:', tokenResult);

    // Save token into the project
    const { data, error } = await supabase
      .from('projects')
      .update({ invitation_token: tokenResult })
      .eq('id', projectId)
      .select('id, invitation_token')
      .single();

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    console.log('Updated project with token:', data);

    // Build the final link using the current origin
    const origin = req.headers.get('origin') || `${supabaseUrl.replace('.supabase.co', '.lovableproject.com')}`;
    const inviteUrl = `${origin}/invite/${data.invitation_token}`;

    console.log('Generated invite URL:', inviteUrl);

    return new Response(JSON.stringify({ 
      success: true,
      link: inviteUrl,
      token: data.invitation_token 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ 
      success: false,
      error: String(err) 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
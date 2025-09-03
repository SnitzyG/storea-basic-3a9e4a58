import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the Authorization header from the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Get user from auth header
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw new Error('Invalid user token')
    }

    // Get current project count before linking
    const { data: beforeProjects } = await supabaseClient
      .from('project_users')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)

    // Call the database function to link pending projects
    const { error: linkingError } = await supabaseClient
      .rpc('link_pending_users_to_projects', {
        user_email: user.email,
        target_user_id: user.id
      })

    if (linkingError) {
      console.error('Error linking projects:', linkingError)
      throw linkingError
    }

    // Get project count after linking
    const { data: afterProjects } = await supabaseClient
      .from('project_users')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)

    const projectsLinked = (afterProjects?.length || 0) - (beforeProjects?.length || 0)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Projects linked successfully',
        projectsLinked: projectsLinked
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WipeRequest {
  password: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { password }: WipeRequest = await req.json()

    // Verify password
    if (password !== 'TheBerrics123!') {
      return new Response(
        JSON.stringify({ error: 'Invalid password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Starting complete user data wipe...')

    // Step 1: Clear foreign key references first
    await supabase.from('document_groups').update({ current_revision_id: null }).not('id', 'is', null)

    // Step 2: Clear all user-generated content tables (respecting foreign key dependencies)
    const tablesToClear = [
      'activity_log',
      'calendar_events',
      'document_approvals',
      'document_events', 
      'document_shares',
      'document_transmittals',
      'document_revisions',
      'document_groups',
      'document_versions',
      'document_status_options',
      'document_types',
      'documents',
      'rfi_activities',
      'rfi_collaboration_comments',
      'rfi_collaborators',
      'rfi_email_delivery',
      'rfi_workflow_transitions',
      'rfi_templates',
      'rfis',
      'message_participants',
      'messages',
      'message_threads',
      'project_join_requests',
      'project_users',
      'invitations',
      'projects',
      'notifications',
      'profiles',
      'companies'
    ]

    // Clear each table
    for (const table of tablesToClear) {
      const { error } = await supabase.from(table).delete().not('id', 'is', null)
      if (error) {
        console.error(`Error clearing ${table}:`, error)
      } else {
        console.log(`Cleared table: ${table}`)
      }
    }

    // Step 3: Clear storage buckets
    const { data: storageObjects } = await supabase.storage.from('documents').list()
    if (storageObjects && storageObjects.length > 0) {
      const filePaths = storageObjects.map(obj => obj.name)
      await supabase.storage.from('documents').remove(filePaths)
      console.log('Cleared storage bucket: documents')
    }

    // Step 4: Clear auth users using admin API
    const { data: users } = await supabase.auth.admin.listUsers()
    if (users && users.users.length > 0) {
      for (const user of users.users) {
        await supabase.auth.admin.deleteUser(user.id)
      }
      console.log(`Deleted ${users.users.length} auth users`)
    }

    console.log('Complete user data wipe finished successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'All user data has been wiped successfully',
        cleared: {
          tables: tablesToClear.length,
          storage: 'documents bucket',
          auth: users?.users.length || 0
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in wipe-test-data function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
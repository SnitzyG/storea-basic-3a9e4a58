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

    console.log('Starting complete user data wipe (preserving admin users)...')

    // Step 0: Get admin user IDs to preserve them
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
    
    const adminUserIds = adminRoles?.map(r => r.user_id) || []
    console.log(`Found ${adminUserIds.length} admin users to preserve`)

    // Step 1: Unlock all documents to avoid foreign key issues
    console.log('Unlocking all documents...')
    await supabase.from('documents').update({ 
      locked_by: null, 
      is_locked: false, 
      locked_at: null 
    }).not('locked_by', 'is', null)
    
    await supabase.from('document_groups').update({ 
      locked_by: null, 
      is_locked: false, 
      locked_at: null,
      current_revision_id: null 
    }).not('id', 'is', null)

    // Step 2: Delete property_zoning records (has FK to auth.users)
    console.log('Clearing property_zoning...')
    const { error: propZoningError } = await supabase
      .from('property_zoning')
      .delete()
      .not('id', 'is', null)
    if (propZoningError) console.error('Error clearing property_zoning:', propZoningError)

    // Step 3: Clear all user-generated content tables (in correct order respecting FK constraints)
    const tablesToClear = [
      // Financial data
      'line_item_budgets',
      'progress_claims',
      'payments',
      'invoices',
      'client_contributions',
      'change_orders',
      'cashflow_items',
      'budget_categories',
      
      // Tender related
      'tender_bid_line_items',
      'tender_bids',
      'tender_line_items',
      'tender_package_documents',
      'tender_packages',
      'tender_access',
      'tender_invitations',
      'tenders',
      'contractor_prequalifications',
      
      // RFI related
      'rfi_activities',
      'rfi_collaboration_comments',
      'rfi_collaborators',
      'rfi_email_delivery',
      'rfi_workflow_transitions',
      'rfi_templates',
      'rfis',
      
      // Message related
      'message_participants',
      'messages',
      'message_threads',
      
      // Document related
      'document_transmittals',
      'document_events',
      'document_approvals',
      'document_shares',
      'document_versions',
      'document_revisions',
      'document_categories',
      'document_status_options',
      'document_types',
      'documents',
      
      // Calendar
      'event_templates',
      'calendar_events',
      
      // Todos
      'todo_items',
      
      // Activity (clear before deleting users to avoid constraint issues)
      'activity_log',
      
      // Project related (do these after activity_log)
      'project_pending_invitations',
      'project_join_requests',
      'project_users',
      'invitations',
      
      // Notifications
      'notifications',
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

    // Step 4: Delete projects (before profiles/companies due to FK)
    console.log('Clearing projects...')
    const { error: projectsError } = await supabase.from('projects').delete().not('id', 'is', null)
    if (projectsError) console.error('Error clearing projects:', projectsError)

    // Step 5: Clear non-admin profiles
    console.log('Clearing non-admin profiles...')
    if (adminUserIds.length > 0) {
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .not('user_id', 'in', `(${adminUserIds.map(id => `'${id}'`).join(',')})`)
      if (profilesError) console.error('Error clearing profiles:', profilesError)
    } else {
      const { error: profilesError } = await supabase.from('profiles').delete().not('id', 'is', null)
      if (profilesError) console.error('Error clearing profiles:', profilesError)
    }

    // Step 6: Clear companies (after profiles)
    console.log('Clearing companies...')
    const { error: companiesError } = await supabase.from('companies').delete().not('id', 'is', null)
    if (companiesError) console.error('Error clearing companies:', companiesError)

    // Step 7: Clear storage buckets
    const buckets = ['documents', 'avatars', 'company-logos']
    for (const bucket of buckets) {
      try {
        const { data: files } = await supabase.storage.from(bucket).list()
        if (files && files.length > 0) {
          const filePaths = files.map(file => file.name)
          await supabase.storage.from(bucket).remove(filePaths)
          console.log(`Cleared storage bucket: ${bucket}`)
        }
      } catch (err) {
        console.error(`Error clearing bucket ${bucket}:`, err)
      }
    }

    // Step 8: Delete all non-admin auth users
    const { data: users } = await supabase.auth.admin.listUsers()
    let deletedCount = 0
    let preservedCount = 0
    
    if (users && users.users.length > 0) {
      for (const user of users.users) {
        // Skip admin users
        if (adminUserIds.includes(user.id)) {
          console.log(`Preserving admin user: ${user.email}`)
          preservedCount++
          continue
        }

        try {
          const { error } = await supabase.auth.admin.deleteUser(user.id)
          if (error) {
            console.error(`Error deleting user ${user.email}:`, error)
          } else {
            deletedCount++
          }
        } catch (err) {
          console.error(`Error deleting user ${user.email}:`, err)
        }
      }
    }
    
    console.log(`Deleted ${deletedCount} non-admin users, preserved ${preservedCount} admin users`)
    console.log('Complete user data wipe finished successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'All non-admin user data has been wiped successfully',
        cleared: {
          tables: tablesToClear.length,
          storage: 'documents, avatars, company-logos buckets',
          deletedUsers: deletedCount,
          preservedAdmins: preservedCount
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
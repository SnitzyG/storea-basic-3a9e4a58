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

    // Verify password from environment variable
    const correctPassword = Deno.env.get('WIPE_PASSWORD')
    if (!correctPassword) {
      return new Response(
        JSON.stringify({ error: 'Wipe password not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (password !== correctPassword) {
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
    
    // Step 0.5: Get all auth users (paginated)
    let allAuthUsers: any[] = []
    let page = 0
    const perPage = 1000
    let hasMore = true
    
    while (hasMore) {
      const { data: usersPage } = await supabase.auth.admin.listUsers({ page, perPage })
      if (usersPage && usersPage.users.length > 0) {
        allAuthUsers = allAuthUsers.concat(usersPage.users)
        page++
        hasMore = usersPage.users.length === perPage
      } else {
        hasMore = false
      }
    }
    
    // Compute non-admin user IDs for targeted deletion
    const nonAdminUserIds = allAuthUsers
      .filter(user => !adminUserIds.includes(user.id))
      .map(user => user.id)
    
    console.log(`Total users: ${allAuthUsers.length}, Non-admin users to delete: ${nonAdminUserIds.length}`)

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
      
      // Activity and notifications (clear before deleting users)
      'activity_log',
      'notifications',
      
      // Admin tracking
      'admin_activity_log',
      
      // Project related
      'project_pending_invitations',
      'project_join_requests',
      'project_users',
      'invitations',
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

    // Step 5: Clear non-admin profiles using IN filter (avoids UUID quoting issues)
    console.log('Clearing non-admin profiles...')
    if (nonAdminUserIds.length > 0) {
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .in('user_id', nonAdminUserIds)
      if (profilesError) console.error('Error clearing profiles:', profilesError)
    } else {
      console.log('No non-admin profiles to clear')
    }

    // Step 6: Clear companies (after profiles)
    console.log('Clearing companies...')
    const { error: companiesError } = await supabase.from('companies').delete().not('id', 'is', null)
    if (companiesError) console.error('Error clearing companies:', companiesError)

    // Step 7: Recursively clear storage buckets
    const buckets = ['documents', 'avatars', 'company-logos']
    
    async function clearBucket(bucketName: string, prefix = '') {
      try {
        const { data: files } = await supabase.storage.from(bucketName).list(prefix)
        if (!files || files.length === 0) return
        
        const filesToDelete: string[] = []
        const foldersToRecurse: string[] = []
        
        for (const file of files) {
          const fullPath = prefix ? `${prefix}/${file.name}` : file.name
          if (file.id === null) {
            // It's a folder
            foldersToRecurse.push(fullPath)
          } else {
            // It's a file
            filesToDelete.push(fullPath)
          }
        }
        
        // Delete files
        if (filesToDelete.length > 0) {
          await supabase.storage.from(bucketName).remove(filesToDelete)
        }
        
        // Recurse into folders
        for (const folder of foldersToRecurse) {
          await clearBucket(bucketName, folder)
        }
      } catch (err) {
        console.error(`Error clearing ${bucketName}/${prefix}:`, err)
      }
    }
    
    for (const bucket of buckets) {
      console.log(`Clearing storage bucket: ${bucket}`)
      await clearBucket(bucket)
      console.log(`Completed clearing bucket: ${bucket}`)
    }

    // Step 8: Delete all non-admin auth users with fallback
    let deletedCount = 0
    let disabledCount = 0
    let preservedCount = adminUserIds.length
    
    console.log(`Attempting to delete ${nonAdminUserIds.length} non-admin auth users...`)
    
    for (const userId of nonAdminUserIds) {
      const user = allAuthUsers.find(u => u.id === userId)
      try {
        // Try to delete the user
        const { error } = await supabase.auth.admin.deleteUser(userId)
        
        if (error) {
          // If deletion fails with 500, try to disable by rotating password
          if (error.message?.includes('500') || error.message?.includes('unexpected_failure')) {
            console.log(`Delete failed for ${user?.email}, rotating password to disable...`)
            const randomPassword = crypto.randomUUID() + crypto.randomUUID() + '!A1a'
            const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
              password: randomPassword
            })
            if (updateError) {
              console.error(`Failed to disable user ${user?.email}:`, updateError)
            } else {
              disabledCount++
              console.log(`Disabled user ${user?.email} via password rotation`)
            }
          } else {
            console.error(`Error deleting user ${user?.email}:`, error)
          }
        } else {
          deletedCount++
        }
      } catch (err) {
        console.error(`Exception deleting user ${user?.email}:`, err)
      }
    }
    
    console.log(`Deleted ${deletedCount} users, disabled ${disabledCount} users, preserved ${preservedCount} admin users`)
    console.log('Complete user data wipe finished successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'All non-admin user data has been wiped successfully',
        cleared: {
          tables: tablesToClear.length,
          storage: 'documents, avatars, company-logos buckets (recursive)',
          deletedUsers: deletedCount,
          disabledUsers: disabledCount,
          preservedAdmins: preservedCount,
          totalNonAdminUsers: nonAdminUserIds.length
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
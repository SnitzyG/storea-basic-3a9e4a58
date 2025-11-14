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
    const expectedPassword = Deno.env.get('WIPE_PASSWORD')
    if (!expectedPassword || password !== expectedPassword) {
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

    // Get all auth users (paginated if necessary)
    const allAuthUsers: string[] = []
    let page = 1
    const perPage = 1000
    let hasMore = true
    
    while (hasMore) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage
      })
      
      if (error) {
        console.error('Error fetching users:', error)
        break
      }
      
      if (data?.users) {
        allAuthUsers.push(...data.users.map(u => u.id))
        hasMore = data.users.length === perPage
        page++
      } else {
        hasMore = false
      }
    }
    
    // Calculate non-admin user IDs
    const nonAdminUserIds = allAuthUsers.filter(id => !adminUserIds.includes(id))
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
      'todos',
      
      // Activity and notifications (clear before deleting users)
      'activity_log',
      'notifications',
      
      // Admin and monitoring tables
      'user_sessions',
      'admin_activity_log',
      'admin_alerts',
      
      // Project related (do these after activity_log)
      'project_join_requests',
      'project_pending_invitations',
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

    // Step 5: Clear non-admin profiles using IN filter
    console.log('Clearing non-admin profiles...')
    if (nonAdminUserIds.length > 0) {
      const { error: profilesError } = await supabase
        .from('profiles')
        .delete()
        .in('user_id', nonAdminUserIds)
      if (profilesError) console.error('Error clearing profiles:', profilesError)
    } else {
      console.log('No non-admin profiles to delete')
    }

    // Step 6: Clear companies (after profiles)
    console.log('Clearing companies...')
    const { error: companiesError } = await supabase.from('companies').delete().not('id', 'is', null)
    if (companiesError) console.error('Error clearing companies:', companiesError)

    // Step 7: Recursively clear storage buckets
    const buckets = ['documents', 'avatars', 'company-logos']
    for (const bucket of buckets) {
      try {
        // Recursive function to delete all files and folders
        async function clearFolder(path: string = '') {
          const { data: items } = await supabase.storage.from(bucket).list(path)
          if (!items || items.length === 0) return

          const filesToDelete: string[] = []
          const foldersToRecurse: string[] = []

          for (const item of items) {
            const itemPath = path ? `${path}/${item.name}` : item.name
            if (item.id === null) {
              // It's a folder
              foldersToRecurse.push(itemPath)
            } else {
              // It's a file
              filesToDelete.push(itemPath)
            }
          }

          // Delete files in current folder
          if (filesToDelete.length > 0) {
            await supabase.storage.from(bucket).remove(filesToDelete)
          }

          // Recurse into subfolders
          for (const folder of foldersToRecurse) {
            await clearFolder(folder)
          }
        }

        await clearFolder()
        console.log(`Recursively cleared storage bucket: ${bucket}`)
      } catch (err) {
        console.error(`Error clearing bucket ${bucket}:`, err)
      }
    }

    // Step 8: Delete all non-admin auth users with fallback
    let deletedCount = 0
    let disabledCount = 0
    let preservedCount = adminUserIds.length
    
    for (const userId of nonAdminUserIds) {
      try {
        const { error } = await supabase.auth.admin.deleteUser(userId)
        if (error) {
          // If deletion fails with 500, try disabling the account by rotating password
          if (error.message?.includes('500') || error.message?.includes('unexpected')) {
            console.log(`Failed to delete user ${userId}, attempting to disable via password rotation`)
            try {
              // Generate a strong random password to block sign-in
              const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
              
              await supabase.auth.admin.updateUserById(userId, {
                password: randomPassword
              })
              disabledCount++
              console.log(`Disabled user ${userId} by rotating password`)
            } catch (disableErr) {
              console.error(`Failed to disable user ${userId}:`, disableErr)
            }
          } else {
            console.error(`Error deleting user ${userId}:`, error)
          }
        } else {
          deletedCount++
        }
      } catch (err) {
        console.error(`Error processing user ${userId}:`, err)
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
          totalProcessed: deletedCount + disabledCount + preservedCount
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

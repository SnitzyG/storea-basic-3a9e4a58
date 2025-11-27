export const supabaseInfrastructure = {
  overview: {
    totalEdgeFunctions: 10,
    totalStorageBuckets: 5,
    totalEnums: 8,
    totalFunctions: 50,
    totalTriggers: 20
  },

  edgeFunctions: [
    {
      name: 'generate-invite-link',
      url: 'https://inibugusrzfihldvegrb.supabase.co/functions/v1/generate-invite-link',
      description: 'Generates secure invitation links for project and tender access',
      trigger: 'Called when sending project/tender invitations',
      authentication: 'Required',
      inputs: ['project_id or tender_id', 'invitee_email', 'role'],
      output: 'Secure invitation token and link',
      integrations: ['Database: invitations table']
    },
    {
      name: 'get-weather',
      url: 'https://inibugusrzfihldvegrb.supabase.co/functions/v1/get-weather',
      description: 'Fetches weather data for project locations using Open-Meteo API',
      trigger: 'Called when displaying project dashboard',
      authentication: 'Required',
      inputs: ['latitude', 'longitude'],
      output: 'Current weather data including temperature, conditions, and forecast',
      integrations: ['Open-Meteo API']
    },
    {
      name: 'link-pending-projects',
      url: 'https://inibugusrzfihldvegrb.supabase.co/functions/v1/link-pending-projects',
      description: 'Links pending project invitations to newly registered users',
      trigger: 'Called after user completes signup',
      authentication: 'Required',
      inputs: ['user_email', 'user_id'],
      output: 'List of linked projects',
      integrations: ['Database: project_pending_invitations', 'project_users']
    },
    {
      name: 'parse-line-items',
      url: 'https://inibugusrzfihldvegrb.supabase.co/functions/v1/parse-line-items',
      description: 'Parses Excel files containing tender line items and cost breakdowns',
      trigger: 'Called when uploading tender BOQ/line item files',
      authentication: 'Required',
      inputs: ['file_data (Excel)', 'tender_id'],
      output: 'Parsed line items array with quantities, rates, and totals',
      integrations: ['XLSX library', 'Database: tender_line_items']
    },
    {
      name: 'security-notifications',
      url: 'https://inibugusrzfihldvegrb.supabase.co/functions/v1/security-notifications',
      description: 'Sends security-related notifications for suspicious activities',
      trigger: 'Called when security events detected (failed logins, policy violations)',
      authentication: 'Required',
      inputs: ['event_type', 'user_id', 'details'],
      output: 'Notification sent confirmation',
      integrations: ['Resend API', 'Database: admin_alerts']
    },
    {
      name: 'send-password-reset',
      url: 'https://inibugusrzfihldvegrb.supabase.co/functions/v1/send-password-reset',
      description: 'Sends password reset emails using Resend',
      trigger: 'Called when user requests password reset',
      authentication: 'Public (no auth required)',
      inputs: ['email'],
      output: 'Email sent confirmation',
      integrations: ['Resend API', 'Supabase Auth']
    },
    {
      name: 'send-rfi-notification',
      url: 'https://inibugusrzfihldvegrb.supabase.co/functions/v1/send-rfi-notification',
      description: 'Sends email notifications for RFI creation, updates, and responses',
      trigger: 'Called when RFI is created, updated, or responded to',
      authentication: 'Required',
      inputs: ['rfi_id', 'action_type', 'recipient_ids'],
      output: 'Email sent confirmation',
      integrations: ['Resend API', 'Database: rfis', 'profiles']
    },
    {
      name: 'send-team-invitation',
      url: 'https://inibugusrzfihldvegrb.supabase.co/functions/v1/send-team-invitation',
      description: 'Sends email invitations for project team members',
      trigger: 'Called when adding new team members to projects',
      authentication: 'Required',
      inputs: ['project_id', 'invitee_email', 'inviter_name', 'role'],
      output: 'Email sent confirmation with invitation link',
      integrations: ['Resend API', 'Database: invitations']
    },
    {
      name: 'send-tender-invitation',
      url: 'https://inibugusrzfihldvegrb.supabase.co/functions/v1/send-tender-invitation',
      description: 'Sends email invitations for tender submissions',
      trigger: 'Called when inviting contractors to submit bids',
      authentication: 'Required',
      inputs: ['tender_id', 'contractor_email', 'issuer_name'],
      output: 'Email sent confirmation with tender access link',
      integrations: ['Resend API', 'Database: tender_access']
    }
  ],

  storageBuckets: [
    {
      name: 'avatars',
      public: true,
      description: 'User and company profile pictures',
      fileSizeLimit: '50 MB (unset)',
      allowedMimeTypes: 'Any',
      policyCount: 4,
      policies: [
        'Public read access for all avatars',
        'Authenticated users can upload their own avatar',
        'Users can update their own avatar',
        'Users can delete their own avatar'
      ]
    },
    {
      name: 'documents',
      public: false,
      description: 'Project documents, drawings, and specifications',
      fileSizeLimit: '50 MB (unset)',
      allowedMimeTypes: 'Any',
      policyCount: 14,
      policies: [
        'Project members can view documents',
        'Project members can upload documents',
        'Document owners can update their documents',
        'Architects/Builders can delete documents',
        'Shared documents accessible to recipients',
        'Private documents only to uploader',
        'RLS enforced by project membership'
      ]
    },
    {
      name: 'scope-of-works',
      public: false,
      description: 'Tender scope of work documents',
      fileSizeLimit: '10 MB',
      allowedMimeTypes: 'application/pdf, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      policyCount: 3,
      policies: [
        'Tender issuers can upload scope of works',
        'Approved contractors can view scope of works',
        'Tender issuers can delete scope of works'
      ]
    },
    {
      name: 'tender-packages',
      public: false,
      description: 'Complete tender package zip files',
      fileSizeLimit: '50 MB (unset)',
      allowedMimeTypes: 'Any',
      policyCount: 8,
      policies: [
        'Tender issuers can upload packages',
        'Approved contractors can download packages',
        'Tender issuers can update packages',
        'Tender issuers can delete packages'
      ]
    },
    {
      name: 'tender-specifications',
      public: false,
      description: 'Tender technical specifications',
      fileSizeLimit: '10 MB',
      allowedMimeTypes: 'application/pdf, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      policyCount: 3,
      policies: [
        'Tender issuers can upload specifications',
        'Approved contractors can view specifications',
        'Tender issuers can delete specifications'
      ]
    }
  ],

  enumeratedTypes: [
    {
      name: 'user_role',
      description: 'Primary user roles for construction industry participants',
      values: ['architect', 'homeowner', 'builder', 'contractor', 'system_admin'],
      usage: 'Stored in profiles table, used for role-based access control throughout application'
    },
    {
      name: 'app_role',
      description: 'Administrative role assignments',
      values: ['admin', 'user'],
      usage: 'Stored in user_roles table for elevated administrative privileges'
    },
    {
      name: 'project_status',
      description: 'Project lifecycle stages',
      values: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
      usage: 'Stored in projects table, affects project filtering and dashboard displays'
    },
    {
      name: 'tender_status',
      description: 'Tender procurement stages',
      values: ['draft', 'open', 'closed', 'awarded', 'cancelled'],
      usage: 'Stored in tenders table, controls tender visibility and bid submissions'
    },
    {
      name: 'rfi_status',
      description: 'RFI workflow states',
      values: ['outstanding', 'overdue', 'responded', 'closed', 'draft', 'sent', 'received', 'in_review', 'answered', 'rejected'],
      usage: 'Stored in rfis table, tracks RFI lifecycle and response requirements'
    },
    {
      name: 'rfi_type',
      description: 'RFI categorization',
      values: ['general_correspondence', 'request_for_information', 'general_advice'],
      usage: 'Stored in rfis table, affects RFI numbering and routing'
    },
    {
      name: 'document_status',
      description: 'Document review and approval states',
      values: ['For Tender', 'For Information', 'For Construction'],
      usage: 'Stored in documents and document_groups tables, indicates document purpose'
    },
    {
      name: 'priority_level',
      description: 'Item priority classification',
      values: ['low', 'medium', 'high', 'critical'],
      usage: 'Used across calendar_events, rfis, and tasks for urgency classification'
    }
  ],

  keyDatabaseFunctions: [
    {
      name: 'generate_unique_tender_id',
      description: 'Generates 15-character alphanumeric tender IDs',
      returns: 'text',
      usage: 'Called by auto_generate_tender_id trigger on tenders table insert'
    },
    {
      name: 'generate_unique_project_id',
      description: 'Generates 15-character alphanumeric project IDs',
      returns: 'text',
      usage: 'Called by auto_generate_project_id trigger on projects table insert'
    },
    {
      name: 'generate_rfi_number',
      description: 'Generates sequential RFI numbers with company prefix and type code',
      parameters: ['project_id uuid', 'rfi_type', 'raised_by uuid'],
      returns: 'text (e.g. "ABC-RFI-0001")',
      usage: 'Called by set_rfi_number trigger on rfis table insert'
    },
    {
      name: 'generate_document_group_number',
      description: 'Generates sequential document numbers with project/company prefix',
      parameters: ['project_id uuid', 'category text', 'project_stage text'],
      returns: 'text (e.g. "ABC-GEN-0001")',
      usage: 'Called by auto_generate_document_group_number trigger'
    },
    {
      name: 'has_role',
      description: 'Security definer function to check if user has admin/moderator role',
      parameters: ['_user_id uuid', '_role app_role'],
      returns: 'boolean',
      usage: 'Used in RLS policies to enforce role-based permissions'
    },
    {
      name: 'is_project_member',
      description: 'Checks if user is member of project',
      parameters: ['project_id uuid', 'user_id uuid'],
      returns: 'boolean',
      usage: 'Used in RLS policies for project-scoped data access'
    },
    {
      name: 'is_project_architect',
      description: 'Checks if user is architect on project',
      parameters: ['project_id uuid', 'user_id uuid'],
      returns: 'boolean',
      usage: 'Used in RLS policies for architect-specific permissions'
    },
    {
      name: 'check_tender_access',
      description: 'Verifies user has approved access to tender',
      parameters: ['_user_id uuid', '_tender_id uuid'],
      returns: 'boolean',
      usage: 'Used in RLS policies for tender data access'
    },
    {
      name: 'handle_new_user',
      description: 'Trigger function to create profile on user signup',
      trigger: 'AFTER INSERT/UPDATE on auth.users',
      actions: ['Creates company if needed', 'Creates profile record', 'Sets default approval status']
    },
    {
      name: 'update_updated_at_column',
      description: 'Trigger function to auto-update updated_at timestamp',
      trigger: 'BEFORE UPDATE on multiple tables',
      actions: ['Sets updated_at = now()']
    },
    {
      name: 'log_activity',
      description: 'Logs user activity to activity_log table',
      parameters: ['entity_type', 'entity_id', 'action', 'description', 'project_id', 'metadata'],
      returns: 'uuid (log entry id)',
      usage: 'Called from application and triggers for audit trail'
    },
    {
      name: 'create_notification',
      description: 'Creates notification for user',
      parameters: ['_user_id uuid', '_title text', '_message text', '_type text', '_data jsonb'],
      returns: 'uuid (notification id)',
      usage: 'Called from application and triggers for user notifications'
    },
    {
      name: 'approve_user',
      description: 'Admin function to approve user accounts',
      parameters: ['target_user_id uuid'],
      returns: 'jsonb {success, message}',
      usage: 'Called from admin dashboard for user approval workflow'
    },
    {
      name: 'grant_admin_by_email',
      description: 'Grants admin role to user by email',
      parameters: ['target_email text'],
      returns: 'jsonb {success, message, user_id}',
      usage: 'Called for admin role assignment'
    },
    {
      name: 'toggle_document_lock',
      description: 'Locks/unlocks document groups',
      parameters: ['group_id uuid', 'should_lock boolean'],
      returns: 'jsonb {success, locked, locked_by, locked_at}',
      usage: 'Called from document management for version control'
    },
    {
      name: 'create_document_supersede',
      description: 'Creates new document revision and archives current',
      parameters: ['group_id uuid', 'file details', 'changes_summary'],
      returns: 'uuid (new revision id)',
      usage: 'Called when superseding documents with new revisions'
    }
  ],

  rlsPolicySummary: {
    totalPolicies: 280,
    breakdown: [
      { category: 'User Management (profiles, companies, user_roles)', count: 15 },
      { category: 'Projects (projects, project_users)', count: 25 },
      { category: 'Documents (documents, document_groups, document_revisions)', count: 45 },
      { category: 'RFIs (rfis, rfi_responses)', count: 30 },
      { category: 'Messages (message_threads, messages)', count: 20 },
      { category: 'Tenders (tenders, tender_bids, tender_access)', count: 40 },
      { category: 'Financial (project_budgets, line_item_budgets, progress_claims)', count: 35 },
      { category: 'Calendar & Tasks (calendar_events, todos)', count: 15 },
      { category: 'Notifications (notifications)', count: 10 },
      { category: 'Admin & Monitoring (activity_log, admin_alerts, audit_logs)', count: 25 },
      { category: 'Telemetry (telemetry_sessions, telemetry_events)', count: 20 }
    ],
    keyPatterns: [
      'Project-scoped access via project_users membership check',
      'Role-based permissions using has_role() function',
      'Owner/creator-only modifications',
      'Tender access controlled by tender_access approval',
      'Admin-only tables using user_roles.role = admin check',
      'Public read with authenticated write patterns',
      'Shared document access via document_shares table'
    ]
  }
};

export const databaseSchema = {
  overview: {
    totalTables: 75,
    categories: [
      'User Management',
      'Projects',
      'Documents',
      'RFIs',
      'Messages',
      'Tenders',
      'Financial Management',
      'Calendar & Tasks',
      'Notifications',
      'Admin & Monitoring',
      'Telemetry'
    ]
  },
  
  tables: {
    // User Management
    profiles: {
      description: 'Core user profile information including role, company details, and professional information',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()', description: 'Primary key' },
        { name: 'user_id', type: 'uuid', nullable: false, description: 'Foreign key to auth.users' },
        { name: 'name', type: 'text', nullable: false, description: 'User display name' },
        { name: 'full_name', type: 'text', nullable: true, description: 'Full legal name' },
        { name: 'role', type: 'user_role', nullable: false, description: 'User role enum: architect, builder, contractor, homeowner, system_admin' },
        { name: 'email', type: 'text', nullable: true, description: 'User email (synced from auth)' },
        { name: 'phone', type: 'text', nullable: true, description: 'Contact phone number' },
        { name: 'avatar_url', type: 'text', nullable: true, description: 'Profile picture URL' },
        { name: 'bio', type: 'text', nullable: true, description: 'User biography' },
        { name: 'company_id', type: 'uuid', nullable: true, description: 'Foreign key to companies' },
        { name: 'company_name', type: 'text', nullable: true, description: 'Company name' },
        { name: 'company_position', type: 'text', nullable: true, description: 'Job title' },
        { name: 'company_phone', type: 'text', nullable: true, description: 'Company phone' },
        { name: 'company_address', type: 'text', nullable: true, description: 'Company address' },
        { name: 'company_website', type: 'text', nullable: true, description: 'Company website URL' },
        { name: 'company_logo_url', type: 'text', nullable: true, description: 'Company logo URL' },
        { name: 'abn', type: 'text', nullable: true, description: 'Australian Business Number' },
        { name: 'business_registration_number', type: 'text', nullable: true, description: 'Business registration' },
        { name: 'professional_license_number', type: 'text', nullable: true, description: 'Professional license' },
        { name: 'years_experience', type: 'integer', nullable: true, description: 'Years of experience' },
        { name: 'specialization', type: 'text[]', nullable: true, description: 'Areas of specialization' },
        { name: 'certifications', type: 'jsonb', nullable: true, description: 'Professional certifications' },
        { name: 'insurance_details', type: 'text', nullable: true, description: 'Insurance information' },
        { name: 'number_of_employees', type: 'integer', nullable: true, description: 'Company size' },
        { name: 'linkedin_url', type: 'text', nullable: true, description: 'LinkedIn profile' },
        { name: 'approved', type: 'boolean', nullable: true, default: 'true', description: 'Admin approval status' },
        { name: 'approved_by', type: 'uuid', nullable: true, description: 'Admin who approved' },
        { name: 'approved_at', type: 'timestamp', nullable: true, description: 'Approval timestamp' },
        { name: 'online_status', type: 'boolean', nullable: true, default: 'false', description: 'Real-time online status' },
        { name: 'last_seen', type: 'timestamp', nullable: true, description: 'Last activity timestamp' },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()', description: 'Creation timestamp' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()', description: 'Last update timestamp' }
      ],
      rlsPolicies: [
        { name: 'Users can view all profiles', command: 'SELECT', using: 'true' },
        { name: 'Users can update own profile', command: 'UPDATE', using: 'auth.uid() = user_id' },
        { name: 'System can insert profiles', command: 'INSERT', check: 'true' }
      ],
      relationships: [
        { target: 'companies.id', via: 'company_id', type: 'many-to-one' }
      ]
    },

    companies: {
      description: 'Company/organization records',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'name', type: 'text', nullable: false },
        { name: 'address', type: 'text', nullable: true },
        { name: 'settings', type: 'jsonb', nullable: true, default: '{}' },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ],
      rlsPolicies: [
        { name: 'Users can view companies', command: 'SELECT', using: 'true' }
      ]
    },

    user_roles: {
      description: 'Additional role assignments (for admins)',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'role', type: 'app_role', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    // Projects
    projects: {
      description: 'Construction project records',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'name', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'status', type: 'text', nullable: false, default: 'planning' },
        { name: 'created_by', type: 'uuid', nullable: false },
        { name: 'company_id', type: 'uuid', nullable: true },
        { name: 'start_date', type: 'date', nullable: true },
        { name: 'end_date', type: 'date', nullable: true },
        { name: 'budget', type: 'numeric', nullable: true },
        { name: 'address', type: 'text', nullable: true },
        { name: 'city', type: 'text', nullable: true },
        { name: 'state', type: 'text', nullable: true },
        { name: 'country', type: 'text', nullable: true },
        { name: 'postal_code', type: 'text', nullable: true },
        { name: 'latitude', type: 'numeric', nullable: true },
        { name: 'longitude', type: 'numeric', nullable: true },
        { name: 'project_type', type: 'text', nullable: true },
        { name: 'size_sqm', type: 'numeric', nullable: true },
        { name: 'timeline', type: 'text', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ],
      rlsPolicies: [
        { name: 'Users can view projects they are members of', command: 'SELECT' },
        { name: 'Users can create projects', command: 'INSERT' },
        { name: 'Project creators can update', command: 'UPDATE' }
      ]
    },

    project_users: {
      description: 'Project team membership and roles',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'project_id', type: 'uuid', nullable: false },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'role', type: 'user_role', nullable: false },
        { name: 'joined_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'invited_by', type: 'uuid', nullable: true },
        { name: 'status', type: 'text', nullable: false, default: 'active' }
      ]
    },

    // Documents
    documents: {
      description: 'Individual document files',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'project_id', type: 'uuid', nullable: false },
        { name: 'name', type: 'text', nullable: false },
        { name: 'title', type: 'text', nullable: true },
        { name: 'file_path', type: 'text', nullable: false },
        { name: 'file_type', type: 'text', nullable: false },
        { name: 'file_extension', type: 'text', nullable: true },
        { name: 'file_size', type: 'bigint', nullable: true },
        { name: 'file_type_category', type: 'text', nullable: true, default: 'Architectural' },
        { name: 'category', type: 'text', nullable: true },
        { name: 'status', type: 'document_status', nullable: false, default: 'For Information' },
        { name: 'status_category', type: 'text', nullable: true },
        { name: 'document_number', type: 'text', nullable: true },
        { name: 'custom_document_number', type: 'text', nullable: true },
        { name: 'version', type: 'integer', nullable: true, default: '1' },
        { name: 'uploaded_by', type: 'uuid', nullable: false },
        { name: 'assigned_to', type: 'uuid', nullable: true },
        { name: 'visibility_scope', type: 'text', nullable: true, default: 'private' },
        { name: 'tags', type: 'text[]', nullable: true },
        { name: 'is_locked', type: 'boolean', nullable: true, default: 'false' },
        { name: 'locked_by', type: 'uuid', nullable: true },
        { name: 'locked_at', type: 'timestamp', nullable: true },
        { name: 'is_superseded', type: 'boolean', nullable: true, default: 'false' },
        { name: 'superseded_by', type: 'uuid', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ],
      rlsPolicies: [
        { name: 'Users can view documents in their projects', command: 'SELECT' },
        { name: 'Users can upload documents', command: 'INSERT' },
        { name: 'Uploaders can update their documents', command: 'UPDATE' }
      ]
    },

    document_groups: {
      description: 'Grouped documents with revision control',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'project_id', type: 'uuid', nullable: false },
        { name: 'title', type: 'text', nullable: false },
        { name: 'document_number', type: 'text', nullable: true },
        { name: 'category', type: 'text', nullable: false, default: 'Architectural' },
        { name: 'project_stage', type: 'text', nullable: true, default: 'General' },
        { name: 'status', type: 'text', nullable: false, default: 'For Information' },
        { name: 'visibility_scope', type: 'text', nullable: false, default: 'private' },
        { name: 'current_revision_id', type: 'uuid', nullable: true },
        { name: 'created_by', type: 'uuid', nullable: false },
        { name: 'is_locked', type: 'boolean', nullable: true, default: 'false' },
        { name: 'locked_by', type: 'uuid', nullable: true },
        { name: 'locked_at', type: 'timestamp', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    document_revisions: {
      description: 'Document revision history',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'document_group_id', type: 'uuid', nullable: false },
        { name: 'revision_number', type: 'integer', nullable: false },
        { name: 'file_name', type: 'text', nullable: false },
        { name: 'file_path', type: 'text', nullable: false },
        { name: 'file_type', type: 'text', nullable: false },
        { name: 'file_extension', type: 'text', nullable: true },
        { name: 'file_size', type: 'bigint', nullable: true },
        { name: 'changes_summary', type: 'text', nullable: true },
        { name: 'uploaded_by', type: 'uuid', nullable: false },
        { name: 'is_current', type: 'boolean', nullable: false, default: 'false' },
        { name: 'is_archived', type: 'boolean', nullable: false, default: 'false' },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    // RFIs (Requests for Information)
    rfis: {
      description: 'Request for Information records',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'project_id', type: 'uuid', nullable: false },
        { name: 'rfi_number', type: 'text', nullable: true },
        { name: 'subject', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: false },
        { name: 'category', type: 'text', nullable: true },
        { name: 'priority', type: 'text', nullable: false, default: 'medium' },
        { name: 'status', type: 'text', nullable: false, default: 'open' },
        { name: 'created_by', type: 'uuid', nullable: false },
        { name: 'assigned_to', type: 'uuid', nullable: true },
        { name: 'due_date', type: 'date', nullable: true },
        { name: 'attachments', type: 'jsonb', nullable: true },
        { name: 'response', type: 'text', nullable: true },
        { name: 'responded_by', type: 'uuid', nullable: true },
        { name: 'responded_at', type: 'timestamp', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ],
      rlsPolicies: [
        { name: 'Users can view RFIs in their projects', command: 'SELECT' },
        { name: 'Users can create RFIs', command: 'INSERT' },
        { name: 'Users can update RFIs they created or are assigned to', command: 'UPDATE' }
      ]
    },

    // Messages
    message_threads: {
      description: 'Message conversation threads',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'project_id', type: 'uuid', nullable: false },
        { name: 'title', type: 'text', nullable: false },
        { name: 'created_by', type: 'uuid', nullable: false },
        { name: 'participants', type: 'text[]', nullable: true },
        { name: 'status', type: 'text', nullable: true, default: 'active' },
        { name: 'topics', type: 'jsonb', nullable: true },
        { name: 'is_pinned', type: 'boolean', nullable: true, default: 'false' },
        { name: 'is_archived', type: 'boolean', nullable: true, default: 'false' },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    messages: {
      description: 'Individual messages within threads',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'thread_id', type: 'uuid', nullable: true },
        { name: 'project_id', type: 'uuid', nullable: false },
        { name: 'sender_id', type: 'uuid', nullable: false },
        { name: 'content', type: 'text', nullable: false },
        { name: 'message_type', type: 'text', nullable: true, default: 'standard' },
        { name: 'inquiry_status', type: 'text', nullable: true },
        { name: 'parent_message_id', type: 'uuid', nullable: true },
        { name: 'quoted_content', type: 'text', nullable: true },
        { name: 'attachments', type: 'jsonb', nullable: true },
        { name: 'is_deleted', type: 'boolean', nullable: true, default: 'false' },
        { name: 'edited_at', type: 'timestamp', nullable: true },
        { name: 'scheduled_at', type: 'timestamp', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    // Tenders
    tenders: {
      description: 'Tender/bid packages',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'project_id', type: 'uuid', nullable: false },
        { name: 'title', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'tender_number', type: 'text', nullable: true },
        { name: 'trade_category', type: 'text', nullable: true },
        { name: 'status', type: 'text', nullable: false, default: 'draft' },
        { name: 'issued_by', type: 'uuid', nullable: false },
        { name: 'issue_date', type: 'date', nullable: true },
        { name: 'closing_date', type: 'timestamp', nullable: true },
        { name: 'budget_range_min', type: 'numeric', nullable: true },
        { name: 'budget_range_max', type: 'numeric', nullable: true },
        { name: 'scope_of_work', type: 'text', nullable: true },
        { name: 'location', type: 'text', nullable: true },
        { name: 'requirements', type: 'jsonb', nullable: true },
        { name: 'documents', type: 'jsonb', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    tender_bids: {
      description: 'Bid submissions for tenders',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'tender_id', type: 'uuid', nullable: false },
        { name: 'contractor_id', type: 'uuid', nullable: false },
        { name: 'bid_amount', type: 'numeric', nullable: false },
        { name: 'timeline_days', type: 'integer', nullable: true },
        { name: 'proposal', type: 'text', nullable: true },
        { name: 'attachments', type: 'jsonb', nullable: true },
        { name: 'status', type: 'text', nullable: false, default: 'submitted' },
        { name: 'submitted_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'reviewed_at', type: 'timestamp', nullable: true },
        { name: 'reviewed_by', type: 'uuid', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    // Financial Management
    project_budgets: {
      description: 'Project budget tracking',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'project_id', type: 'uuid', nullable: false },
        { name: 'original_budget', type: 'numeric', nullable: false },
        { name: 'revised_budget', type: 'numeric', nullable: true },
        { name: 'currency', type: 'text', nullable: false, default: 'AUD' },
        { name: 'project_management_margin_percent', type: 'numeric', nullable: true },
        { name: 'provisional_sums_total', type: 'numeric', nullable: true },
        { name: 'prime_cost_sums_total', type: 'numeric', nullable: true },
        { name: 'created_by', type: 'uuid', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    line_item_budgets: {
      description: 'Detailed line-item budget breakdown',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'project_id', type: 'uuid', nullable: false },
        { name: 'item_number', type: 'integer', nullable: false },
        { name: 'item_name', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'category', type: 'text', nullable: false, default: 'General' },
        { name: 'quantity', type: 'numeric', nullable: true },
        { name: 'unit', type: 'text', nullable: true },
        { name: 'rate', type: 'numeric', nullable: true },
        { name: 'total', type: 'numeric', nullable: true },
        { name: 'contract_budget', type: 'numeric', nullable: false, default: '0' },
        { name: 'revised_budget', type: 'numeric', nullable: true },
        { name: 'percentage_complete', type: 'numeric', nullable: false, default: '0' },
        { name: 'total_claimed_to_date', type: 'numeric', nullable: false, default: '0' },
        { name: 'balance_to_claim', type: 'numeric', nullable: false, default: '0' },
        { name: 'forecast_to_complete', type: 'numeric', nullable: true },
        { name: 'notes', type: 'text', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    progress_claims: {
      description: 'Progress billing claims',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'project_id', type: 'uuid', nullable: false },
        { name: 'claim_number', type: 'text', nullable: false },
        { name: 'claim_date', type: 'date', nullable: false },
        { name: 'month_period', type: 'text', nullable: true },
        { name: 'status', type: 'text', nullable: false, default: 'draft' },
        { name: 'total_works_completed_to_date', type: 'numeric', nullable: false, default: '0' },
        { name: 'total_variations_included', type: 'numeric', nullable: false, default: '0' },
        { name: 'total_amount_excl_gst', type: 'numeric', nullable: false, default: '0' },
        { name: 'gst_applicable', type: 'numeric', nullable: false, default: '0' },
        { name: 'total_amount_incl_gst', type: 'numeric', nullable: false, default: '0' },
        { name: 'created_by', type: 'uuid', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    change_orders: {
      description: 'Contract change orders and variations',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'project_id', type: 'uuid', nullable: false },
        { name: 'order_number', type: 'text', nullable: false },
        { name: 'title', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'reason', type: 'text', nullable: true },
        { name: 'financial_impact', type: 'numeric', nullable: false, default: '0' },
        { name: 'timeline_impact_days', type: 'integer', nullable: true, default: '0' },
        { name: 'status', type: 'text', nullable: false, default: 'pending' },
        { name: 'requested_by', type: 'uuid', nullable: false },
        { name: 'approved_by', type: 'uuid', nullable: true },
        { name: 'approval_date', type: 'date', nullable: true },
        { name: 'variation_reference', type: 'text', nullable: true },
        { name: 'percentage_complete', type: 'numeric', nullable: true, default: '0' },
        { name: 'amount_claimed', type: 'numeric', nullable: true, default: '0' },
        { name: 'balance_remaining', type: 'numeric', nullable: true, default: '0' },
        { name: 'claimed_in_claim_id', type: 'uuid', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    // Calendar & Tasks
    calendar_events: {
      description: 'Calendar events and meetings',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'project_id', type: 'uuid', nullable: true },
        { name: 'title', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'start_datetime', type: 'timestamp', nullable: false },
        { name: 'end_datetime', type: 'timestamp', nullable: true },
        { name: 'category', type: 'text', nullable: true, default: 'general' },
        { name: 'priority', type: 'text', nullable: true, default: 'medium' },
        { name: 'status', type: 'text', nullable: true, default: 'scheduled' },
        { name: 'location', type: 'text', nullable: true },
        { name: 'is_meeting', type: 'boolean', nullable: true, default: 'false' },
        { name: 'meeting_link', type: 'text', nullable: true },
        { name: 'attendees', type: 'jsonb', nullable: true },
        { name: 'external_attendees', type: 'text[]', nullable: true },
        { name: 'reminder_minutes', type: 'integer', nullable: true },
        { name: 'created_by', type: 'uuid', nullable: false },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    todos: {
      description: 'User task management',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'project_id', type: 'uuid', nullable: true },
        { name: 'title', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: true },
        { name: 'priority', type: 'text', nullable: true, default: 'medium' },
        { name: 'status', type: 'text', nullable: false, default: 'pending' },
        { name: 'due_date', type: 'date', nullable: true },
        { name: 'completed_at', type: 'timestamp', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    // Notifications
    notifications: {
      description: 'User notifications',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'type', type: 'text', nullable: false },
        { name: 'title', type: 'text', nullable: false },
        { name: 'message', type: 'text', nullable: false },
        { name: 'data', type: 'jsonb', nullable: true },
        { name: 'read', type: 'boolean', nullable: true, default: 'false' },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    // Admin & Monitoring
    activity_log: {
      description: 'System activity audit log',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'user_id', type: 'uuid', nullable: false },
        { name: 'entity_type', type: 'text', nullable: false },
        { name: 'entity_id', type: 'uuid', nullable: true },
        { name: 'action', type: 'text', nullable: false },
        { name: 'description', type: 'text', nullable: false },
        { name: 'project_id', type: 'uuid', nullable: true },
        { name: 'metadata', type: 'jsonb', nullable: true },
        { name: 'ip_address', type: 'inet', nullable: true },
        { name: 'user_agent', type: 'text', nullable: true },
        { name: 'session_id', type: 'uuid', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: false, default: 'now()' }
      ]
    },

    admin_alerts: {
      description: 'System alerts for administrators',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, default: 'gen_random_uuid()' },
        { name: 'alert_type', type: 'text', nullable: false },
        { name: 'severity', type: 'text', nullable: false },
        { name: 'title', type: 'text', nullable: false },
        { name: 'message', type: 'text', nullable: true },
        { name: 'metadata', type: 'jsonb', nullable: true },
        { name: 'is_read', type: 'boolean', nullable: true, default: 'false' },
        { name: 'resolved_at', type: 'timestamp', nullable: true },
        { name: 'created_at', type: 'timestamp', nullable: true, default: 'now()' }
      ]
    }
  },

  storageBuckets: [
    {
      name: 'project-files',
      description: 'General project file storage',
      public: false,
      policies: ['Users can access files from their projects']
    },
    {
      name: 'documents',
      description: 'Document management system files',
      public: false,
      policies: ['Project members can access documents']
    },
    {
      name: 'avatars',
      description: 'User profile pictures',
      public: true,
      policies: ['Users can upload their own avatars', 'Avatars are publicly readable']
    },
    {
      name: 'company-logos',
      description: 'Company logo images',
      public: true,
      policies: ['Company members can upload logos', 'Logos are publicly readable']
    }
  ],

  databaseFunctions: [
    {
      name: 'update_updated_at_column',
      description: 'Trigger function to automatically update updated_at timestamp',
      returnType: 'trigger',
      language: 'plpgsql'
    },
    {
      name: 'handle_new_user',
      description: 'Creates profile entry when new user signs up',
      returnType: 'trigger',
      language: 'plpgsql'
    },
    {
      name: 'generate_rfi_number',
      description: 'Generates sequential RFI numbers per project',
      returnType: 'text',
      language: 'plpgsql'
    }
  ]
};

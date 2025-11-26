export const pageDocumentation = {
  overview: {
    totalPages: 30,
    categories: [
      'Public Pages (7)',
      'Auth Pages (3)',
      'Dashboard & Main App (6)',
      'Project Management (4)',
      'Admin Pages (5)',
      'Utility Pages (5)'
    ]
  },

  publicPages: {
    home: {
      route: '/',
      component: 'src/pages/public/Home.tsx',
      layout: 'PublicLayout',
      description: 'Marketing homepage',
      sections: [
        {
          name: 'Hero Section',
          components: ['HeroSection'],
          features: ['Headline', 'CTA buttons', 'Demo video embed']
        },
        {
          name: 'Features Grid',
          components: ['FeatureCard'],
          features: ['6 key features', 'Icons', 'Descriptions']
        },
        {
          name: 'How It Works',
          features: ['3-step process', 'Visual timeline', 'Role-specific workflows']
        },
        {
          name: 'Testimonials',
          features: ['User quotes', 'Company logos', 'Ratings']
        },
        {
          name: 'CTA Section',
          features: ['Final call-to-action', 'Sign up button']
        }
      ],
      seo: {
        title: 'STOREA - Construction Project Management Platform',
        description: 'Streamline construction projects with document management, RFIs, tenders, and team collaboration',
        keywords: ['construction management', 'project management', 'document control', 'RFI management']
      }
    },

    features: {
      route: '/features',
      component: 'src/pages/public/Features.tsx',
      layout: 'PublicLayout',
      description: 'Detailed feature showcase',
      sections: [
        {
          name: 'Document Management',
          features: ['Version control', 'Document transmittals', 'Approval workflows']
        },
        {
          name: 'RFI Management',
          features: ['Request tracking', 'Response workflows', 'Email integration']
        },
        {
          name: 'Tender Management',
          features: ['Tender packages', 'Bid comparison', 'Contractor prequalification']
        },
        {
          name: 'Financial Management',
          features: ['Budget tracking', 'Progress claims', 'Change orders']
        },
        {
          name: 'Team Collaboration',
          features: ['Real-time messaging', 'Shared calendar', 'Task management']
        }
      ]
    },

    pricing: {
      route: '/pricing',
      component: 'src/pages/public/Pricing.tsx',
      layout: 'PublicLayout',
      description: 'Pricing plans',
      sections: [
        {
          name: 'Pricing Cards',
          components: ['PricingCard'],
          plans: ['Free', 'Professional', 'Enterprise']
        },
        {
          name: 'Feature Comparison',
          features: ['Comparison table', 'All features listed']
        },
        {
          name: 'FAQ',
          component: 'FAQSection'
        }
      ]
    },

    about: {
      route: '/about',
      component: 'src/pages/public/About.tsx',
      layout: 'PublicLayout',
      description: 'About STOREA and the team',
      sections: [
        { name: 'Company Story', features: ['Mission', 'Vision', 'Values'] },
        { name: 'Team', features: ['Team members', 'Roles'] },
        { name: 'Technology', features: ['Tech stack overview'] }
      ]
    },

    contact: {
      route: '/contact',
      component: 'src/pages/public/Contact.tsx',
      layout: 'PublicLayout',
      description: 'Contact form and information',
      sections: [
        {
          name: 'Contact Form',
          components: ['ContactForm'],
          features: ['Name, Email, Message fields', 'Form validation', 'Email submission']
        },
        {
          name: 'Contact Info',
          features: ['Email address', 'Phone number', 'Office address']
        }
      ]
    },

    terms: {
      route: '/terms',
      component: 'src/pages/public/Terms.tsx',
      layout: 'PublicLayout',
      description: 'Terms of Service',
      content: 'Legal terms and conditions'
    },

    privacy: {
      route: '/privacy',
      component: 'src/pages/public/Privacy.tsx',
      layout: 'PublicLayout',
      description: 'Privacy Policy',
      content: 'Data privacy and protection policies'
    }
  },

  authPages: {
    auth: {
      route: '/auth',
      component: 'src/pages/Auth.tsx',
      description: 'Sign in / Sign up page',
      features: [
        'Email/password authentication',
        'Email verification',
        'Magic link option',
        'OAuth providers (if configured)',
        'Password strength indicator',
        'Rate limiting',
        'CAPTCHA for security'
      ],
      flow: [
        'User enters email/password',
        'Validation',
        'Supabase authentication',
        'Email verification check',
        'Redirect to profile setup (if new user) or dashboard'
      ]
    },

    profileSetup: {
      route: '/profile-setup',
      component: 'src/pages/ProfileSetup.tsx',
      description: '3-step profile completion wizard',
      steps: [
        {
          step: 1,
          title: 'Personal Information',
          component: 'Step1PersonalInfo',
          fields: ['Full name', 'Phone', 'Bio', 'Avatar upload']
        },
        {
          step: 2,
          title: 'Professional Information',
          component: 'Step2ProfessionalInfo',
          fields: ['Role selection', 'Years experience', 'Specializations', 'Certifications', 'License number']
        },
        {
          step: 3,
          title: 'Company Information',
          component: 'Step3CompanyInfo',
          fields: ['Company name', 'ABN', 'Address', 'Phone', 'Website', 'Logo upload', 'Number of employees']
        }
      ],
      features: [
        'Progress indicator',
        'Form validation per step',
        'Save draft',
        'Skip option (if made optional)',
        'Role-specific fields'
      ]
    },

    userApproval: {
      route: '/user-approval',
      component: 'src/pages/UserApproval.tsx',
      description: 'Waiting for admin approval screen',
      display: [
        'Pending approval message',
        'Instructions',
        'Contact admin option',
        'Logout button'
      ],
      behavior: 'Blocks access to app until approved by admin'
    }
  },

  mainAppPages: {
    dashboard: {
      route: '/dashboard',
      component: 'src/pages/Dashboard.tsx',
      layout: 'AppLayout',
      description: 'Main dashboard overview',
      sections: [
        {
          name: 'Header',
          components: ['PageTitle'],
          features: ['Welcome message', 'Current date/time']
        },
        {
          name: 'Quick Actions',
          component: 'QuickActions',
          features: ['Create RFI', 'Upload Document', 'New Message', 'Add Event']
        },
        {
          name: 'Project Status Overview',
          component: 'ProjectStatusOverview',
          features: ['Total projects', 'Active projects', 'Upcoming milestones', 'Weather widget']
        },
        {
          name: 'Recent Activity',
          component: 'RecentActivity',
          features: ['Activity feed', 'Real-time updates', 'Activity types']
        },
        {
          name: 'Calendar Widget',
          component: 'CalendarWidget',
          features: ["Today's events", 'Upcoming events']
        },
        {
          name: 'To-Do List Widget',
          component: 'ToDoList',
          features: ['Pending tasks', 'Quick complete']
        },
        {
          name: 'Open RFIs',
          component: 'OpenRFIs',
          features: ['RFI count by status', 'Priority breakdown']
        }
      ],
      roleVariations: {
        architect: 'Sees all project data, document stats',
        builder: 'Focus on construction tasks, financials',
        contractor: 'Limited to assigned projects, tender opportunities',
        homeowner: 'Simple overview, pending actions'
      }
    },

    projects: {
      route: '/projects',
      component: 'src/pages/Projects.tsx',
      layout: 'AppLayout',
      description: 'Project list and management',
      sections: [
        {
          name: 'Header',
          features: ['Page title', 'Create Project button (conditional)']
        },
        {
          name: 'Project Filters',
          features: ['Filter by status', 'Search', 'Sort options']
        },
        {
          name: 'Project Grid',
          components: ['ProjectCard'],
          features: ['Project cards in grid layout', 'Project info', 'Team avatars', 'Quick actions']
        },
        {
          name: 'Create Project Dialog',
          component: 'CreateProjectDialog',
          fields: ['Name', 'Description', 'Start/End dates', 'Address', 'Budget', 'Type']
        }
      ],
      interactions: [
        'Click project card to view details',
        'Click Create Project (if authorized)',
        'Filter and search projects'
      ],
      roleAccess: {
        architect: 'Full CRUD',
        builder: 'Full CRUD',
        contractor: 'View only assigned projects',
        homeowner: 'View only their projects'
      }
    },

    documents: {
      route: '/documents',
      component: 'src/pages/Documents.tsx',
      layout: 'AppLayout',
      description: 'Document management system',
      sections: [
        {
          name: 'Header',
          features: ['Page title', 'Upload Document button', 'View toggle (grid/list)']
        },
        {
          name: 'Document Filters',
          component: 'DocumentFilters',
          features: ['Category filter', 'Status filter', 'Type filter', 'Search', 'Date range']
        },
        {
          name: 'Document List',
          components: ['DocumentCard', 'DocumentListView'],
          features: ['Document cards/rows', 'File info', 'Status badges', 'Actions menu']
        },
        {
          name: 'Upload Dialog',
          component: 'DocumentUpload',
          features: ['Drag-and-drop', 'Multiple files', 'Metadata entry', 'Category selection']
        },
        {
          name: 'Document Details Dialog',
          component: 'DocumentDetailsDialog',
          features: ['Preview', 'Metadata', 'Version history', 'Comments', 'Share options']
        }
      ],
      features: [
        'Document versioning',
        'Revision control',
        'Document groups',
        'Superseding documents',
        'Document locking',
        'Approval workflows',
        'Transmittals',
        'Sharing permissions'
      ],
      storage: 'Supabase Storage bucket: documents'
    },

    tenders: {
      route: '/tenders',
      component: 'src/pages/Tenders.tsx',
      layout: 'AppLayout',
      description: 'Tender package management and bidding',
      sections: [
        {
          name: 'Header',
          features: ['Page title', 'Create Tender button (for architects/builders)', 'Tabs: All Tenders / My Bids']
        },
        {
          name: 'Tender Filters',
          features: ['Status filter', 'Trade category', 'Date range']
        },
        {
          name: 'Tender List',
          components: ['TenderCard'],
          features: ['Tender cards', 'Status', 'Closing date countdown', 'Bid count']
        },
        {
          name: 'Create Tender Wizard',
          component: 'CreateTenderDialog',
          steps: [
            'Basic Info (title, description, category)',
            'Scope of Work',
            'Documents',
            'Budget & Timeline',
            'Contractor Selection'
          ]
        },
        {
          name: 'Tender Details View',
          component: 'TenderDetailsView',
          tabs: ['Overview', 'Documents', 'Bids (for issuers)', 'Line Items', 'Activity']
        },
        {
          name: 'Bid Submission',
          component: 'BidSubmissionForm',
          features: ['Bid amount', 'Timeline', 'Proposal text', 'Attachments', 'Line item pricing']
        },
        {
          name: 'Bid Comparison',
          component: 'EnhancedBidComparison',
          features: ['Side-by-side comparison', 'Scoring matrix', 'Financial breakdown']
        }
      ],
      workflow: {
        architect: [
          'Create tender package',
          'Attach documents and line items',
          'Invite contractors',
          'Review bids',
          'Award contract'
        ],
        contractor: [
          'View tender opportunities',
          'Request access (if required)',
          'Download tender documents',
          'Submit bid',
          'Track bid status'
        ]
      }
    },

    rfis: {
      route: '/rfis',
      component: 'src/pages/RFIs.tsx',
      layout: 'AppLayout',
      description: 'Request for Information management',
      sections: [
        {
          name: 'Header',
          features: ['Page title', 'Create RFI button', 'View toggle (inbox/list)']
        },
        {
          name: 'RFI Filters',
          component: 'RFIFilters',
          features: ['Status', 'Priority', 'Assigned to', 'Category', 'Date']
        },
        {
          name: 'RFI List',
          components: ['RFICard', 'RFIInbox'],
          features: ['RFI cards in list', 'Status badges', 'Priority indicators', 'Due dates']
        },
        {
          name: 'Create RFI Dialog',
          component: 'CreateRFIDialog',
          fields: ['Subject', 'Description', 'Category', 'Priority', 'Assign to', 'Due date', 'Attachments']
        },
        {
          name: 'RFI Details',
          component: 'RFIDetailsDialog',
          sections: ['RFI Info', 'Response Section', 'Attachments', 'Activity History']
        }
      ],
      features: [
        'Auto-generated RFI numbers',
        'Email notifications',
        'Response workflows',
        'Status tracking (Open, Responded, Closed)',
        'Attachment support',
        'Activity logging'
      ]
    },

    messages: {
      route: '/messages',
      component: 'src/pages/Messages.tsx',
      layout: 'AppLayout',
      description: 'Team messaging and communication',
      layout_structure: {
        left: 'Thread list sidebar',
        right: 'Message view pane'
      },
      sections: [
        {
          name: 'Thread List',
          features: ['Search threads', 'Filter by project', 'Create new thread', 'Thread cards with preview']
        },
        {
          name: 'Message View',
          components: ['MessageBubble', 'MessageInput'],
          features: ['Message history', 'Sender info', 'Timestamps', 'Attachments', 'Reply/Edit/Delete']
        },
        {
          name: 'Create Thread Dialog',
          component: 'CreateThreadDialog',
          fields: ['Thread title', 'Select participants', 'Initial message']
        }
      ],
      features: [
        'Real-time messaging',
        'Thread-based conversations',
        'File attachments',
        'Participant management',
        'Message search',
        'Read receipts',
        'Typing indicators',
        'Pin important threads',
        'Archive threads'
      ]
    },

    calendar: {
      route: '/calendar',
      component: 'src/pages/Calendar.tsx',
      layout: 'AppLayout',
      description: 'Calendar and event management',
      sections: [
        {
          name: 'Calendar View',
          features: ['Month/Week/Day views', 'Event display', 'Click to view details', 'Drag to create']
        },
        {
          name: 'Event List Sidebar',
          features: ['Upcoming events', 'Filter by project', 'Filter by category']
        },
        {
          name: 'Create Event Dialog',
          fields: [
            'Title',
            'Description',
            'Start/End datetime',
            'All-day toggle',
            'Location',
            'Project',
            'Category',
            'Priority',
            'Is meeting toggle',
            'Meeting link',
            'Attendees (internal)',
            'External attendees',
            'Reminder'
          ]
        }
      ],
      eventCategories: ['General', 'Meeting', 'Deadline', 'Inspection', 'Milestone', 'Holiday'],
      features: [
        'Multiple calendar views',
        'Event categories',
        'Priority levels',
        'Meeting integration',
        'Attendee management',
        'Reminders',
        'Recurring events',
        'External calendar sync (future)'
      ]
    },

    financials: {
      route: '/financials',
      component: 'src/pages/Financials.tsx',
      layout: 'AppLayout',
      description: 'Financial management for projects',
      requiresProject: true,
      tabs: [
        {
          name: 'Budget',
          component: 'BudgetOverview',
          sections: [
            'Contract summary',
            'Budget overview',
            'Line item budgets table',
            'Category breakdown'
          ]
        },
        {
          name: 'Progress Claims',
          component: 'ProgressClaimsSection',
          features: [
            'Create claim',
            'Claim list',
            'Claim details',
            'Export to PDF'
          ]
        },
        {
          name: 'Change Orders',
          component: 'ChangeOrdersSection',
          features: [
            'Create change order',
            'Approval workflow',
            'Financial impact',
            'Link to progress claim'
          ]
        },
        {
          name: 'Invoices',
          component: 'InvoicesSection',
          features: [
            'Invoice list',
            'Create invoice',
            'Payment tracking',
            'Export'
          ]
        },
        {
          name: 'Payments',
          component: 'PaymentsSection',
          features: [
            'Payment schedule',
            'Record payments',
            'Payment stages',
            'Client contributions'
          ]
        },
        {
          name: 'Cashflow',
          component: 'CashflowForecast',
          features: [
            'Forecast chart',
            'Income vs expense',
            'Forecast items'
          ]
        }
      ],
      features: [
        'Budget tracking',
        'Line item management',
        'Progress billing',
        'Change order management',
        'Invoice generation',
        'Payment tracking',
        'Cashflow forecasting',
        'Excel import/export',
        'PDF generation'
      ],
      roleAccess: {
        architect: 'Full access',
        builder: 'Full access',
        contractor: 'View only',
        homeowner: 'View only'
      }
    },

    todoList: {
      route: '/todo',
      component: 'src/pages/TodoList.tsx',
      layout: 'AppLayout',
      description: 'Personal task management',
      sections: [
        {
          name: 'Header',
          features: ['Page title', 'Add Task button']
        },
        {
          name: 'Task Filters',
          features: ['All', 'Pending', 'In Progress', 'Completed', 'Filter by project', 'Filter by priority']
        },
        {
          name: 'Task List',
          features: [
            'Task cards',
            'Checkbox to complete',
            'Priority indicators',
            'Due date',
            'Project tag',
            'Edit/Delete actions'
          ]
        },
        {
          name: 'Add Task Dialog',
          fields: ['Title', 'Description', 'Priority', 'Due date', 'Project', 'Status']
        }
      ],
      features: [
        'Create personal tasks',
        'Assign to project',
        'Set priority',
        'Set due date',
        'Mark complete',
        'Filter and sort',
        'Task notifications'
      ]
    }
  },

  adminPages: {
    adminDashboard: {
      route: '/admin/dashboard',
      component: 'src/pages/admin/AdminDashboard.tsx',
      layout: 'AdminLayout',
      requiresRole: 'system_admin',
      description: 'Admin dashboard with system overview',
      sections: [
        {
          name: 'System Stats',
          component: 'DashboardOverviewWidget',
          metrics: [
            'Total users',
            'Active users',
            'Total projects',
            'Active projects',
            'Total documents',
            'Storage used',
            'Pending approvals'
          ]
        },
        {
          name: 'System Health',
          component: 'SystemHealthWidget',
          metrics: ['API health', 'Database health', 'Storage health', 'Edge functions health']
        },
        {
          name: 'Real-time Activity',
          component: 'RealtimeActivityLog',
          features: ['Live activity feed', 'User actions', 'System events', 'Error tracking']
        },
        {
          name: 'Quick Access',
          features: [
            'User approvals link',
            'System alerts link',
            'Audit logs link',
            'Documentation link'
          ]
        }
      ]
    },

    adminApprovals: {
      route: '/admin/approvals',
      component: 'src/pages/AdminApprovals.tsx',
      layout: 'AdminLayout',
      requiresRole: 'system_admin',
      description: 'User approval management',
      sections: [
        {
          name: 'Pending Approvals',
          component: 'UserApprovalDashboard',
          features: [
            'List of pending users',
            'User details',
            'Profile information',
            'Approve button',
            'Reject button',
            'Bulk actions'
          ]
        }
      ],
      actions: [
        'Approve user (sets approved=true)',
        'Reject user (deletes profile or marks rejected)',
        'View user details'
      ]
    },

    systemAlerts: {
      route: '/admin/alerts',
      component: 'src/pages/admin/SystemAlerts.tsx',
      layout: 'AdminLayout',
      requiresRole: 'system_admin',
      description: 'System alerts and issues',
      sections: [
        {
          name: 'Alert List',
          features: [
            'Filter by severity',
            'Filter by type',
            'Show resolved toggle',
            'Alert cards with details'
          ]
        },
        {
          name: 'Alert Details',
          features: ['Full alert info', 'Metadata', 'Resolve button', 'Dismiss button']
        }
      ],
      alertTypes: [
        'security',
        'performance',
        'error',
        'warning',
        'user_action',
        'system_event'
      ],
      severities: ['info', 'warning', 'error', 'critical']
    },

    auditLogs: {
      route: '/admin/audit-logs',
      component: 'src/pages/admin/AuditLogs.tsx',
      layout: 'AdminLayout',
      requiresRole: 'system_admin',
      description: 'Complete audit log of admin actions',
      sections: [
        {
          name: 'Log Filters',
          features: [
            'Filter by admin',
            'Filter by action type',
            'Filter by resource type',
            'Date range',
            'Search'
          ]
        },
        {
          name: 'Log Table',
          columns: [
            'Timestamp',
            'Admin',
            'Action',
            'Resource Type',
            'Resource ID',
            'Status',
            'IP Address',
            'User Agent',
            'Changes (JSON diff)'
          ]
        }
      ],
      features: [
        'Comprehensive logging',
        'Change tracking',
        'IP and user agent logging',
        'Export to CSV',
        'Detailed change diffs'
      ]
    },

    documentation: {
      route: '/admin/documentation',
      component: 'src/pages/admin/Documentation.tsx',
      layout: 'AdminLayout',
      requiresRole: 'system_admin',
      description: 'Platform documentation viewer and PDF export',
      sections: [
        {
          name: 'Header',
          features: ['Download PDF button', 'Last updated date', 'Version']
        },
        {
          name: 'Documentation Tabs',
          tabs: [
            'Overview',
            'Integrations',
            'Database',
            'User Roles',
            'Security',
            'Setup'
          ]
        }
      ],
      features: [
        'View documentation in-app',
        'Download complete PDF',
        'Searchable content',
        'Tabbed navigation'
      ]
    }
  },

  utilityPages: {
    acceptInvitation: {
      route: '/accept-invitation/:token',
      component: 'src/pages/AcceptInvitation.tsx',
      description: 'Project invitation acceptance page',
      flow: [
        'Extract token from URL',
        'Validate token',
        'Check if user is authenticated',
        'If not authenticated, show login/signup',
        'Accept invitation',
        'Add user to project',
        'Redirect to project'
      ]
    },

    joinProject: {
      route: '/join-project/:projectId',
      component: 'src/pages/JoinProject.tsx',
      description: 'Join project via direct link',
      flow: [
        'Check authentication',
        'Fetch project details',
        'Show project info',
        'Request to join button',
        'Create join request or add user directly',
        'Redirect to project'
      ]
    },

    joinTender: {
      route: '/join-tender/:tenderId',
      component: 'src/pages/JoinTender.tsx',
      description: 'Request access to tender',
      flow: [
        'Check authentication',
        'Fetch tender details',
        'Show tender info',
        'Request access button',
        'Create tender access request',
        'Notify tender issuer'
      ]
    },

    notFound: {
      route: '*',
      component: 'src/pages/NotFound.tsx',
      description: '404 error page',
      features: [
        '404 message',
        'Helpful links',
        'Back to dashboard button'
      ]
    }
  },

  routingStructure: {
    publicRoutes: [
      '/',
      '/features',
      '/pricing',
      '/about',
      '/contact',
      '/terms',
      '/privacy'
    ],
    authRoutes: [
      '/auth',
      '/profile-setup',
      '/user-approval'
    ],
    protectedRoutes: [
      '/dashboard',
      '/projects',
      '/documents',
      '/tenders',
      '/rfis',
      '/messages',
      '/calendar',
      '/financials',
      '/todo'
    ],
    adminRoutes: [
      '/admin/dashboard',
      '/admin/approvals',
      '/admin/alerts',
      '/admin/audit-logs',
      '/admin/documentation'
    ],
    utilityRoutes: [
      '/accept-invitation/:token',
      '/join-project/:projectId',
      '/join-tender/:tenderId',
      '/*'
    ]
  }
};

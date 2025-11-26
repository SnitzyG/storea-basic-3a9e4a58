export const componentLibrary = {
  overview: {
    totalComponents: 60,
    uiComponents: 40,
    featureComponents: 20,
    categories: [
      'Layout Components',
      'UI Primitives (shadcn/ui)',
      'Dashboard Components',
      'Document Management',
      'RFI Components',
      'Tender Components',
      'Message Components',
      'Financial Components',
      'Admin Components',
      'Marketing/Public Components'
    ]
  },

  layoutComponents: {
    AppLayout: {
      path: 'src/components/layout/AppLayout.tsx',
      description: 'Main authenticated app layout wrapper with sidebar and header',
      props: [
        { name: 'children', type: 'React.ReactNode', required: true }
      ],
      features: [
        'Authentication check and redirect',
        'Admin role detection',
        'Email verification check',
        'Profile approval check',
        'Renders Sidebar and Header',
        'Wraps content in ProjectSelectionProvider'
      ],
      usage: 'Wraps all authenticated routes'
    },

    Sidebar: {
      path: 'src/components/layout/Sidebar.tsx',
      description: 'Left navigation sidebar with role-based menu items',
      props: [
        { name: 'userRole', type: 'string', required: true },
        { name: 'profile', type: 'Profile', required: false }
      ],
      features: [
        'Dynamic menu based on user role',
        'Real-time notification badges',
        'Active route highlighting',
        'Company logo display',
        'Conditional tab visibility (Projects, Tenders, Financials, Admin)'
      ],
      usage: 'Rendered by AppLayout for authenticated users'
    },

    Header: {
      path: 'src/components/layout/Header.tsx',
      description: 'Top header with project selector, search, and user menu',
      props: [],
      features: [
        'ProjectSelector dropdown',
        'GlobalSearch component',
        'NotificationCenter',
        'User profile dropdown',
        'Theme toggle',
        'Real-time online status indicator'
      ]
    },

    ProjectSelector: {
      path: 'src/components/layout/ProjectSelector.tsx',
      description: 'Dropdown for switching between projects',
      features: [
        'Lists user projects',
        'Shows active project',
        'Updates ProjectSelectionContext',
        'Create new project button'
      ]
    },

    AdminLayout: {
      path: 'src/components/admin/AdminLayout.tsx',
      description: 'Layout wrapper for admin pages',
      props: [
        { name: 'children', type: 'React.ReactNode', required: true }
      ],
      features: [
        'Admin authentication check',
        'AdminSidebar',
        'Breadcrumb navigation'
      ]
    },

    AdminSidebar: {
      path: 'src/components/admin/AdminSidebar.tsx',
      description: 'Admin panel navigation',
      features: [
        'Links to admin sections',
        'Real-time alert count badges',
        'Pending approval count badges'
      ]
    },

    PublicLayout: {
      path: 'src/components/marketing/PublicLayout.tsx',
      description: 'Layout for public marketing pages',
      features: [
        'NavBar',
        'Footer',
        'SEO meta tags'
      ]
    }
  },

  uiPrimitives: {
    Button: {
      path: 'src/components/ui/button.tsx',
      description: 'Versatile button component with variants',
      props: [
        { name: 'variant', type: "'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'", required: false },
        { name: 'size', type: "'default' | 'sm' | 'lg' | 'icon'", required: false },
        { name: 'asChild', type: 'boolean', required: false }
      ],
      variants: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
      sizes: ['default', 'sm', 'lg', 'icon']
    },

    Card: {
      path: 'src/components/ui/card.tsx',
      description: 'Container card with header, content, footer sections',
      subComponents: ['CardHeader', 'CardTitle', 'CardDescription', 'CardContent', 'CardFooter']
    },

    Dialog: {
      path: 'src/components/ui/dialog.tsx',
      description: 'Modal dialog component',
      subComponents: [
        'Dialog',
        'DialogTrigger',
        'DialogContent',
        'DialogHeader',
        'DialogTitle',
        'DialogDescription',
        'DialogFooter'
      ],
      features: ['Accessible', 'Keyboard navigation', 'Focus trap', 'Portal rendering']
    },

    Sheet: {
      path: 'src/components/ui/sheet.tsx',
      description: 'Slide-out panel from edge of screen',
      variants: ['right', 'left', 'top', 'bottom']
    },

    Tabs: {
      path: 'src/components/ui/tabs.tsx',
      description: 'Tabbed interface',
      subComponents: ['Tabs', 'TabsList', 'TabsTrigger', 'TabsContent']
    },

    Table: {
      path: 'src/components/ui/table.tsx',
      description: 'Data table components',
      subComponents: ['Table', 'TableHeader', 'TableBody', 'TableRow', 'TableHead', 'TableCell', 'TableCaption']
    },

    Form: {
      path: 'src/components/ui/form.tsx',
      description: 'Form components integrated with react-hook-form',
      subComponents: ['Form', 'FormField', 'FormItem', 'FormLabel', 'FormControl', 'FormDescription', 'FormMessage'],
      features: ['Validation', 'Error handling', 'Accessibility']
    },

    Input: {
      path: 'src/components/ui/input.tsx',
      description: 'Text input field'
    },

    Textarea: {
      path: 'src/components/ui/textarea.tsx',
      description: 'Multi-line text input'
    },

    Select: {
      path: 'src/components/ui/select.tsx',
      description: 'Dropdown select component',
      features: ['Search', 'Multi-select', 'Keyboard navigation']
    },

    Checkbox: {
      path: 'src/components/ui/checkbox.tsx',
      description: 'Checkbox input'
    },

    Switch: {
      path: 'src/components/ui/switch.tsx',
      description: 'Toggle switch'
    },

    Badge: {
      path: 'src/components/ui/badge.tsx',
      description: 'Status badge/pill',
      variants: ['default', 'secondary', 'destructive', 'outline']
    },

    Avatar: {
      path: 'src/components/ui/avatar.tsx',
      description: 'User avatar with fallback',
      features: ['Image loading', 'Fallback initials', 'Custom sizes']
    },

    Toast: {
      path: 'src/components/ui/toast.tsx',
      description: 'Notification toast',
      integration: 'Sonner library'
    },

    Calendar: {
      path: 'src/components/ui/calendar.tsx',
      description: 'Date picker calendar',
      integration: 'react-day-picker'
    },

    Dropdown: {
      path: 'src/components/ui/dropdown-menu.tsx',
      description: 'Dropdown menu component',
      subComponents: ['DropdownMenu', 'DropdownMenuTrigger', 'DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuSeparator']
    }
  },

  dashboardComponents: {
    QuickActions: {
      path: 'src/components/dashboard/QuickActions.tsx',
      description: 'Quick action buttons on dashboard',
      features: [
        'Create RFI',
        'Upload Document',
        'New Message',
        'Add Event',
        'Role-based action visibility'
      ]
    },

    ProjectStatusOverview: {
      path: 'src/components/dashboard/ProjectStatusOverview.tsx',
      description: 'Project summary cards',
      features: [
        'Total projects count',
        'Active projects',
        'Upcoming milestones',
        'Weather widget'
      ]
    },

    RecentActivity: {
      path: 'src/components/dashboard/RecentActivity.tsx',
      description: 'Activity feed showing recent actions',
      features: [
        'Real-time updates',
        'Activity types (document, RFI, message, tender)',
        'User avatars',
        'Relative timestamps'
      ]
    },

    CalendarWidget: {
      path: 'src/components/dashboard/CalendarWidget.tsx',
      description: 'Mini calendar with upcoming events',
      features: [
        'Today\'s events',
        'Upcoming events (7 days)',
        'Event categories',
        'Link to full calendar'
      ]
    },

    ToDoList: {
      path: 'src/components/dashboard/ToDoList.tsx',
      description: 'Task list widget',
      features: [
        'Pending tasks',
        'Priority indicators',
        'Quick complete',
        'Link to full todo page'
      ]
    },

    OpenRFIs: {
      path: 'src/components/dashboard/OpenRFIs.tsx',
      description: 'Open RFI summary',
      features: [
        'Count by status',
        'Priority breakdown',
        'Overdue indicator'
      ]
    }
  },

  documentComponents: {
    DocumentUpload: {
      path: 'src/components/documents/DocumentUpload.tsx',
      description: 'File upload interface with drag-and-drop',
      features: [
        'Drag and drop',
        'Multiple file selection',
        'File type validation',
        'Progress tracking',
        'Supabase Storage integration'
      ]
    },

    DocumentCard: {
      path: 'src/components/documents/DocumentCard.tsx',
      description: 'Document display card with actions',
      props: [
        { name: 'document', type: 'Document', required: true }
      ],
      features: [
        'File type icon',
        'Document metadata',
        'Action menu (view, download, edit, delete)',
        'Status badge',
        'Lock indicator',
        'Superseded indicator'
      ]
    },

    DocumentFilters: {
      path: 'src/components/documents/DocumentFilters.tsx',
      description: 'Document filtering interface',
      features: [
        'Filter by category',
        'Filter by status',
        'Filter by type',
        'Search by name',
        'Date range filter'
      ]
    },

    DocumentDetailsDialog: {
      path: 'src/components/documents/DocumentDetailsDialog.tsx',
      description: 'Full document details modal',
      features: [
        'Document preview',
        'Metadata display',
        'Version history',
        'Comments',
        'Activity log',
        'Share options'
      ]
    },

    DocumentVersionHistory: {
      path: 'src/components/documents/DocumentVersionHistory.tsx',
      description: 'Version history display',
      features: [
        'List all versions',
        'Compare versions',
        'Restore previous version',
        'Download any version'
      ]
    }
  },

  rfiComponents: {
    CreateRFIDialog: {
      path: 'src/components/rfis/CreateRFIDialog.tsx',
      description: 'Dialog for creating new RFI',
      features: [
        'Form validation',
        'File attachments',
        'Assign to user',
        'Priority selection',
        'Due date picker'
      ]
    },

    RFICard: {
      path: 'src/components/rfis/RFICard.tsx',
      description: 'RFI summary card',
      features: [
        'RFI number and subject',
        'Status badge',
        'Priority indicator',
        'Assigned user',
        'Due date',
        'Quick actions'
      ]
    },

    RFIDetailsDialog: {
      path: 'src/components/rfis/RFIDetailsDialog.tsx',
      description: 'Full RFI details modal',
      features: [
        'Complete RFI information',
        'Response form',
        'Attachments',
        'Activity history',
        'Status updates'
      ]
    },

    RFIFilters: {
      path: 'src/components/rfis/RFIFilters.tsx',
      description: 'RFI filtering controls',
      features: [
        'Filter by status',
        'Filter by priority',
        'Filter by assigned user',
        'Filter by category',
        'Date filters'
      ]
    }
  },

  tenderComponents: {
    CreateTenderDialog: {
      path: 'src/components/tenders/CreateTenderDialog.tsx',
      description: 'Dialog for creating tender packages',
      features: [
        'Multi-step wizard',
        'Scope of work editor',
        'Document attachment',
        'Budget range',
        'Closing date'
      ]
    },

    TenderCard: {
      path: 'src/components/tenders/TenderCard.tsx',
      description: 'Tender summary card',
      features: [
        'Tender number and title',
        'Status badge',
        'Trade category',
        'Closing date countdown',
        'Bid count',
        'Budget range'
      ]
    },

    BidSubmissionForm: {
      path: 'src/components/tenders/BidSubmissionForm.tsx',
      description: 'Form for submitting bids',
      features: [
        'Bid amount',
        'Timeline estimate',
        'Proposal text editor',
        'File attachments',
        'Line item pricing'
      ]
    },

    TenderDetailsView: {
      path: 'src/components/tenders/TenderDetailsView.tsx',
      description: 'Full tender details',
      features: [
        'Complete tender information',
        'Documents gallery',
        'Bid list (for issuers)',
        'Bid comparison tools',
        'Submit bid button (for contractors)'
      ]
    },

    EnhancedBidComparison: {
      path: 'src/components/tenders/EnhancedBidComparison.tsx',
      description: 'Side-by-side bid comparison',
      features: [
        'Compare multiple bids',
        'Scoring matrix',
        'Financial breakdown',
        'Timeline comparison',
        'Contractor profile comparison'
      ]
    }
  },

  messageComponents: {
    CreateThreadDialog: {
      path: 'src/components/messages/CreateThreadDialog.tsx',
      description: 'Create new message thread',
      features: [
        'Thread title',
        'Participant selection',
        'Initial message',
        'Topic tags'
      ]
    },

    ThreadCard: {
      path: 'src/components/messages/ThreadCard.tsx',
      description: 'Message thread preview',
      features: [
        'Thread title',
        'Last message preview',
        'Participant avatars',
        'Unread indicator',
        'Pinned indicator'
      ]
    },

    MessageBubble: {
      path: 'src/components/messages/MessageBubble.tsx',
      description: 'Individual message display',
      features: [
        'Sender info',
        'Message content',
        'Timestamp',
        'Attachments',
        'Reply/Edit/Delete actions',
        'Read receipts'
      ]
    },

    MessageInput: {
      path: 'src/components/messages/MessageInput.tsx',
      description: 'Message composition input',
      features: [
        'Text editor',
        'File attachment',
        'Emoji picker',
        '@ mentions',
        'Send button'
      ]
    }
  },

  financialComponents: {
    BudgetOverview: {
      path: 'src/components/financials/BudgetOverview.tsx',
      description: 'Project budget summary',
      features: [
        'Original vs revised budget',
        'Spent to date',
        'Remaining budget',
        'Variance indicators'
      ]
    },

    LineItemBudgets: {
      path: 'src/components/financials/LineItemBudgets.tsx',
      description: 'Detailed line item budget table',
      features: [
        'Editable line items',
        'Category grouping',
        'Progress tracking',
        'Import from Excel',
        'Export to Excel'
      ]
    },

    ProgressClaimsSection: {
      path: 'src/components/financials/ProgressClaimsSection.tsx',
      description: 'Progress claims management',
      features: [
        'Create new claim',
        'Claim list',
        'Status tracking',
        'PDF export'
      ]
    },

    ChangeOrdersSection: {
      path: 'src/components/financials/ChangeOrdersSection.tsx',
      description: 'Change orders and variations',
      features: [
        'Create change order',
        'Approval workflow',
        'Financial impact tracking',
        'Timeline impact'
      ]
    }
  },

  adminComponents: {
    DashboardOverviewWidget: {
      path: 'src/components/admin/DashboardOverviewWidget.tsx',
      description: 'Admin dashboard stats overview',
      features: [
        'Total users count',
        'Active projects',
        'System health',
        'Recent activity'
      ]
    },

    UserApprovalDashboard: {
      path: 'src/components/admin/UserApprovalDashboard.tsx',
      description: 'Pending user approvals',
      features: [
        'List pending users',
        'User details',
        'Approve/reject actions',
        'Bulk actions'
      ]
    },

    SystemHealthWidget: {
      path: 'src/components/admin/SystemHealthWidget.tsx',
      description: 'System health monitoring',
      features: [
        'API status',
        'Database health',
        'Storage usage',
        'Error rate'
      ]
    },

    RealtimeActivityLog: {
      path: 'src/components/admin/RealtimeActivityLog.tsx',
      description: 'Live activity monitoring',
      features: [
        'Real-time updates',
        'Activity filtering',
        'User actions',
        'System events'
      ]
    }
  },

  marketingComponents: {
    HeroSection: {
      path: 'src/components/marketing/HeroSection.tsx',
      description: 'Homepage hero section',
      features: [
        'Headline',
        'Subheading',
        'CTA buttons',
        'Demo video',
        'Animated graphics'
      ]
    },

    FeatureCard: {
      path: 'src/components/marketing/FeatureCard.tsx',
      description: 'Feature highlight card',
      props: [
        { name: 'icon', type: 'LucideIcon', required: true },
        { name: 'title', type: 'string', required: true },
        { name: 'description', type: 'string', required: true }
      ]
    },

    PricingCard: {
      path: 'src/components/marketing/PricingCard.tsx',
      description: 'Pricing tier card',
      features: [
        'Plan name',
        'Price',
        'Features list',
        'CTA button'
      ]
    },

    ContactForm: {
      path: 'src/components/marketing/ContactForm.tsx',
      description: 'Contact form',
      features: [
        'Form validation',
        'Email submission',
        'Success message'
      ]
    }
  }
};

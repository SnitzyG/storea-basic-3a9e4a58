export const hooksDocumentation = {
  overview: {
    totalHooks: 58,
    categories: [
      'Authentication & Authorization',
      'Data Fetching & State',
      'Real-time Subscriptions',
      'Forms & Validation',
      'UI & UX',
      'Admin & Monitoring',
      'Utilities'
    ]
  },

  authHooks: {
    useAuth: {
      path: 'src/hooks/useAuth.ts',
      description: 'Access authentication context and user profile',
      returns: {
        user: 'Supabase user object',
        profile: 'User profile with role and company info',
        signIn: 'Sign in function',
        signUp: 'Sign up function',
        signOut: 'Sign out function',
        loading: 'Loading state'
      },
      usage: 'const { user, profile, signOut } = useAuth();'
    },

    useSecureAuth: {
      path: 'src/hooks/useSecureAuth.ts',
      description: 'Enhanced authentication with security features',
      features: [
        'Login attempt tracking',
        'Rate limiting',
        'CSRF protection',
        'Session management'
      ]
    }
  },

  dataFetchingHooks: {
    useProjects: {
      path: 'src/hooks/useProjects.ts',
      description: 'Fetch and manage user projects',
      returns: {
        projects: 'Array of projects',
        loading: 'Loading state',
        error: 'Error state',
        createProject: 'Create project function',
        updateProject: 'Update project function',
        deleteProject: 'Delete project function',
        refetch: 'Refetch projects'
      },
      dependencies: ['@tanstack/react-query', 'supabase']
    },

    useDocuments: {
      path: 'src/hooks/useDocuments.ts',
      description: 'Fetch and manage documents for a project',
      parameters: {
        projectId: 'UUID of the project'
      },
      returns: {
        documents: 'Array of documents',
        loading: 'Loading state',
        error: 'Error state',
        uploadDocument: 'Upload function',
        updateDocument: 'Update function',
        deleteDocument: 'Delete function',
        refetch: 'Refetch documents'
      }
    },

    useRFIs: {
      path: 'src/hooks/useRFIs.ts',
      description: 'Fetch and manage RFIs for a project',
      parameters: {
        projectId: 'UUID of the project'
      },
      returns: {
        rfis: 'Array of RFIs',
        loading: 'Loading state',
        createRFI: 'Create RFI function',
        updateRFI: 'Update RFI function',
        respondToRFI: 'Submit response function'
      }
    },

    useTenders: {
      path: 'src/hooks/useTenders.ts',
      description: 'Fetch and manage tenders',
      returns: {
        tenders: 'Array of tenders',
        loading: 'Loading state',
        createTender: 'Create tender function',
        updateTender: 'Update tender function',
        deleteTender: 'Delete tender function'
      }
    },

    useMessages: {
      path: 'src/hooks/useMessages.ts',
      description: 'Fetch and manage messages/threads',
      parameters: {
        projectId: 'UUID of the project'
      },
      returns: {
        threads: 'Message threads',
        messages: 'Messages in thread',
        sendMessage: 'Send message function',
        createThread: 'Create thread function'
      }
    },

    useFinancials: {
      path: 'src/hooks/useFinancials.ts',
      description: 'Fetch financial data for project',
      parameters: {
        projectId: 'UUID of the project'
      },
      returns: {
        budget: 'Project budget',
        lineItems: 'Line item budgets',
        progressClaims: 'Progress claims',
        changeOrders: 'Change orders',
        invoices: 'Invoices',
        payments: 'Payments'
      }
    },

    useTodos: {
      path: 'src/hooks/useTodos.ts',
      description: 'Fetch and manage user tasks',
      returns: {
        todos: 'Array of tasks',
        createTodo: 'Create task function',
        updateTodo: 'Update task function',
        deleteTodo: 'Delete task function',
        toggleComplete: 'Toggle completion function'
      }
    },

    useCalendarEvents: {
      path: 'src/hooks/useCalendarEvents.ts',
      description: 'Fetch and manage calendar events',
      parameters: {
        projectId: 'Optional project UUID'
      },
      returns: {
        events: 'Calendar events',
        createEvent: 'Create event function',
        updateEvent: 'Update event function',
        deleteEvent: 'Delete event function'
      }
    }
  },

  realtimeHooks: {
    useGlobalRealtime: {
      path: 'src/hooks/useGlobalRealtime.ts',
      description: 'Subscribe to real-time updates across all tables',
      parameters: {
        projectId: 'Optional project UUID to scope updates'
      },
      returns: {
        subscribed: 'Subscription status'
      },
      features: [
        'Automatic reconnection',
        'Multiple channel subscriptions',
        'Event broadcasting'
      ]
    },

    useRealtimeMonitoring: {
      path: 'src/hooks/useRealtimeMonitoring.ts',
      description: 'Real-time system monitoring for admins',
      returns: {
        activeUsers: 'Currently active users',
        recentErrors: 'Recent system errors',
        systemHealth: 'Health metrics'
      }
    },

    useTeamSync: {
      path: 'src/hooks/useTeamSync.ts',
      description: 'Sync team member online status',
      parameters: {
        projectId: 'Project UUID'
      },
      returns: {
        onlineUsers: 'Array of online user IDs'
      }
    }
  },

  formHooks: {
    useFormValidation: {
      path: 'src/hooks/useFormValidation.ts',
      description: 'Form validation utilities',
      parameters: {
        schema: 'Zod validation schema'
      },
      returns: {
        validate: 'Validation function',
        errors: 'Validation errors'
      }
    },

    useAutoSave: {
      path: 'src/hooks/useAutoSave.ts',
      description: 'Auto-save form data',
      parameters: {
        data: 'Form data object',
        saveFunction: 'Save callback',
        delay: 'Debounce delay (ms)'
      },
      features: [
        'Debounced saving',
        'Save status indicator',
        'Error handling'
      ]
    }
  },

  uiHooks: {
    useToast: {
      path: 'src/hooks/use-toast.ts',
      description: 'Toast notification management',
      returns: {
        toast: 'Show toast function',
        toasts: 'Active toasts',
        dismiss: 'Dismiss toast function'
      },
      usage: "toast({ title: 'Success', description: 'Saved!' });"
    },

    useViewEditMode: {
      path: 'src/hooks/useViewEditMode.ts',
      description: 'Toggle between view and edit modes',
      returns: {
        isEditing: 'Edit mode state',
        toggleEdit: 'Toggle function',
        startEdit: 'Enter edit mode',
        cancelEdit: 'Exit edit mode'
      }
    },

    useMobile: {
      path: 'src/hooks/use-mobile.tsx',
      description: 'Detect mobile viewport',
      returns: {
        isMobile: 'Boolean indicating mobile viewport'
      }
    },

    useTabNotifications: {
      path: 'src/hooks/useTabNotifications.ts',
      description: 'Browser tab notifications (title, favicon)',
      parameters: {
        count: 'Notification count'
      },
      features: [
        'Updates document title',
        'Flashing favicon',
        'Badge in title'
      ]
    }
  },

  adminHooks: {
    useAdminStats: {
      path: 'src/hooks/useAdminStats.ts',
      description: 'Fetch admin dashboard statistics',
      returns: {
        stats: {
          totalUsers: 'number',
          activeProjects: 'number',
          pendingApprovals: 'number',
          totalDocuments: 'number',
          systemHealth: 'string'
        },
        loading: 'boolean'
      }
    },

    useRealtimeAdminStats: {
      path: 'src/hooks/useRealtimeAdminStats.ts',
      description: 'Real-time admin statistics',
      features: [
        'Live user count',
        'Active sessions',
        'Error rate',
        'System metrics'
      ]
    },

    useAdminAlerts: {
      path: 'src/hooks/useAdminAlerts.ts',
      description: 'Manage admin alerts',
      returns: {
        alerts: 'Array of alerts',
        unresolvedCount: 'Count of unresolved alerts',
        resolveAlert: 'Resolve function',
        dismissAlert: 'Dismiss function'
      }
    },

    useUserSessionMonitoring: {
      path: 'src/hooks/useUserSessionMonitoring.ts',
      description: 'Monitor user sessions',
      returns: {
        activeSessions: 'Active user sessions',
        sessionHistory: 'Historical data'
      }
    },

    useSystemHealth: {
      path: 'src/hooks/useSystemHealth.ts',
      description: 'System health monitoring',
      returns: {
        apiHealth: 'API status',
        databaseHealth: 'Database status',
        storageHealth: 'Storage status',
        overallHealth: 'Overall system health'
      }
    },

    useAPIMonitoring: {
      path: 'src/hooks/useAPIMonitoring.ts',
      description: 'Monitor API performance',
      returns: {
        requestCount: 'Total requests',
        errorRate: 'Error percentage',
        avgResponseTime: 'Average response time',
        endpoints: 'Endpoint statistics'
      }
    }
  },

  utilityHooks: {
    useNotifications: {
      path: 'src/hooks/useNotifications.ts',
      description: 'User notification management',
      returns: {
        notifications: 'Array of notifications',
        unreadCount: 'Unread count',
        markAsRead: 'Mark as read function',
        markAllAsRead: 'Mark all as read function',
        deleteNotification: 'Delete function'
      }
    },

    useGlobalSearch: {
      path: 'src/hooks/useGlobalSearch.ts',
      description: 'Search across projects, documents, RFIs, etc.',
      parameters: {
        query: 'Search query string'
      },
      returns: {
        results: 'Search results',
        loading: 'Loading state',
        search: 'Search function'
      },
      features: [
        'Multi-entity search',
        'Debounced input',
        'Fuzzy matching',
        'Result ranking'
      ]
    },

    usePageMeta: {
      path: 'src/hooks/usePageMeta.ts',
      description: 'Set page metadata (title, description)',
      parameters: {
        title: 'Page title',
        description: 'Meta description',
        keywords: 'Meta keywords'
      },
      features: [
        'Updates document title',
        'Sets meta tags',
        'SEO optimization'
      ]
    },

    useProjectLinking: {
      path: 'src/hooks/useProjectLinking.ts',
      description: 'Link pending projects to user after signup',
      features: [
        'Checks invitation tokens',
        'Links projects automatically',
        'Updates project access'
      ]
    },

    useRateLimit: {
      path: 'src/hooks/useRateLimit.ts',
      description: 'Client-side rate limiting',
      parameters: {
        maxAttempts: 'Maximum attempts',
        windowMs: 'Time window in ms'
      },
      returns: {
        attempt: 'Record attempt function',
        isLimited: 'Rate limit status',
        resetLimit: 'Reset function'
      }
    },

    useAnalytics: {
      path: 'src/hooks/useAnalytics.ts',
      description: 'Track user analytics and events',
      returns: {
        trackEvent: 'Track event function',
        trackPageView: 'Track page view function',
        trackError: 'Track error function'
      }
    }
  },

  contextHooks: {
    useProjectSelection: {
      source: 'src/context/ProjectSelectionContext.tsx',
      description: 'Access selected project context',
      returns: {
        selectedProjectId: 'Current project ID',
        setSelectedProjectId: 'Set project function',
        selectedProject: 'Full project object'
      }
    },

    useTheme: {
      source: 'src/context/ThemeContext.tsx',
      description: 'Access theme context',
      returns: {
        theme: "'light' | 'dark' | 'system'",
        setTheme: 'Set theme function',
        resolvedTheme: "'light' | 'dark'"
      }
    },

    useNotificationContext: {
      source: 'src/context/NotificationContext.tsx',
      description: 'Access notification context',
      returns: {
        notifications: 'Array of notifications',
        addNotification: 'Add notification function',
        removeNotification: 'Remove notification function',
        clearNotifications: 'Clear all function'
      }
    },

    useRealtime: {
      source: 'src/context/RealtimeContext.tsx',
      description: 'Access real-time connection context',
      returns: {
        isConnected: 'Connection status',
        subscribe: 'Subscribe function',
        unsubscribe: 'Unsubscribe function'
      }
    }
  }
};

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { subHours, subDays, startOfDay, startOfWeek, startOfMonth, isPast } from 'date-fns';

// ========== TYPE DEFINITIONS ==========

interface APIMonitoring {
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  endpoints: { endpoint: string; requestCount: number; avgResponseTime: number; errorRate: number }[];
  status: 'healthy' | 'degraded' | 'down';
}

interface DatabaseMonitoring {
  avgQueryResponseTime: number;
  slowQueries: number;
  activeConnections: number;
  errorRate: number;
  status: 'healthy' | 'degraded' | 'down';
  recentErrors: any[];
}

interface SecurityMonitoring {
  failedLoginAttempts24h: number;
  rlsViolations: number;
  securityScore: number;
  recentSecurityEvents: any[];
  status: 'secure' | 'warning' | 'critical';
}

interface StorageMonitoring {
  totalStorageUsedMB: number;
  storageQuotaMB: number;
  percentageUsed: number;
  buckets: { name: string; size_mb: number; file_count: number }[];
  largestFiles: { name: string; size_mb: number; bucket: string }[];
  status: 'healthy' | 'warning' | 'critical';
}

interface MessagesMonitoring {
  totalThreads: number;
  messagesSent24h: number;
  messagesSent7d: number;
  messagesSent30d: number;
  avgResponseTimeMinutes: number;
  activeThreads: number;
  totalUnreadMessages: number;
  mostActiveUsers: { user_id: string; username: string; message_count: number }[];
  recentMessages: any[];
}

interface DocumentsMonitoring {
  totalDocuments: number;
  uploadedToday: number;
  uploadedThisWeek: number;
  uploadedThisMonth: number;
  categoryBreakdown: { category: string; count: number }[];
  topProjects: { project_id: string; project_name: string; document_count: number }[];
  averageSizeKB: number;
  totalStorageMB: number;
  failedUploads: number;
  recentUploads: any[];
}

interface CalendarMonitoring {
  totalEvents: number;
  eventsToday: number;
  eventsThisWeek: number;
  eventsThisMonth: number;
  overdueEvents: number;
  upcomingEvents: any[];
  eventsByType: { type: string; count: number }[];
  mostBusyProjects: { project_id: string; project_name: string; event_count: number }[];
}

interface TasksMonitoring {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  completionRate: number;
  tasksByPriority: { priority: string; count: number }[];
  mostProductiveUsers: { user_id: string; username: string; completed_count: number }[];
  recentTasks: any[];
}

interface EdgeFunctionsMonitoring {
  totalExecutions: number;
  functions: { name: string; executionCount: number; errorRate: number; avgExecutionTime: number }[];
  overallErrorRate: number;
  status: 'healthy' | 'degraded' | 'down';
}

interface SystemMonitoringHub {
  api: APIMonitoring | null;
  database: DatabaseMonitoring | null;
  security: SecurityMonitoring | null;
  storage: StorageMonitoring | null;
  messages: MessagesMonitoring | null;
  documents: DocumentsMonitoring | null;
  calendar: CalendarMonitoring | null;
  tasks: TasksMonitoring | null;
  edgeFunctions: EdgeFunctionsMonitoring | null;
  overallHealth: 'healthy' | 'degraded' | 'critical';
}

// ========== INDIVIDUAL FETCH FUNCTIONS ==========

async function fetchAPIStats(): Promise<APIMonitoring> {
  try {
    const startTime = Date.now();
    await supabase.from('profiles').select('id', { count: 'exact', head: true });
    const responseTime = Date.now() - startTime;

    const mockEndpoints = [
      { endpoint: '/api/projects', requestCount: 1247, avgResponseTime: 123, errorRate: 0.8 },
      { endpoint: '/api/documents', requestCount: 892, avgResponseTime: 156, errorRate: 0.2 },
      { endpoint: '/api/messages', requestCount: 2341, avgResponseTime: 89, errorRate: 0.5 },
      { endpoint: '/api/rfis', requestCount: 567, avgResponseTime: 201, errorRate: 1.2 },
      { endpoint: '/api/tenders', requestCount: 423, avgResponseTime: 178, errorRate: 0.3 },
    ];

    const totalRequests = mockEndpoints.reduce((sum, e) => sum + e.requestCount, 0);
    const errorRate = mockEndpoints.reduce((sum, e) => sum + (e.errorRate * e.requestCount), 0) / totalRequests;

    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (errorRate > 5) status = 'down';
    else if (errorRate > 2 || responseTime > 1000) status = 'degraded';

    return { totalRequests, avgResponseTime: responseTime, errorRate, endpoints: mockEndpoints, status };
  } catch {
    return { totalRequests: 0, avgResponseTime: 0, errorRate: 100, endpoints: [], status: 'down' };
  }
}

async function fetchDatabaseStats(): Promise<DatabaseMonitoring> {
  try {
    const startTime = Date.now();
    await supabase.from('profiles').select('id', { count: 'exact', head: true });
    const responseTime = Date.now() - startTime;

    const oneHourAgo = subHours(new Date(), 1).toISOString();
    const { count: slowQueries } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo);

    const { data: recentErrors } = await supabase
      .from('activity_log')
      .select('*')
      .eq('action', 'error')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false })
      .limit(10);

    const { count: totalActivities } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo);

    const errorRate = totalActivities && recentErrors 
      ? (recentErrors.length / totalActivities) * 100 
      : 0;

    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (responseTime > 2000 || errorRate > 10) status = 'down';
    else if (responseTime > 1000 || errorRate > 5) status = 'degraded';

    return {
      avgQueryResponseTime: responseTime,
      slowQueries: slowQueries || 0,
      activeConnections: 0,
      errorRate: Math.round(errorRate * 100) / 100,
      status,
      recentErrors: recentErrors || [],
    };
  } catch {
    return { avgQueryResponseTime: 0, slowQueries: 0, activeConnections: 0, errorRate: 100, status: 'down', recentErrors: [] };
  }
}

async function fetchSecurityStats(): Promise<SecurityMonitoring> {
  try {
    const last24h = subHours(new Date(), 24).toISOString();
    const { data: recentActivity } = await supabase
      .from('activity_log')
      .select('*')
      .gte('created_at', last24h)
      .order('created_at', { ascending: false })
      .limit(50);

    let securityScore = 100;
    const failedAttempts = 0;
    const rlsViolations = 0;

    if (failedAttempts > 50) securityScore -= 30;
    else if (failedAttempts > 20) securityScore -= 15;
    else if (failedAttempts > 10) securityScore -= 5;
    if (rlsViolations > 0) securityScore -= 20;

    let status: 'secure' | 'warning' | 'critical' = 'secure';
    if (securityScore < 50) status = 'critical';
    else if (securityScore < 75) status = 'warning';

    return {
      failedLoginAttempts24h: failedAttempts,
      rlsViolations,
      securityScore,
      recentSecurityEvents: recentActivity || [],
      status,
    };
  } catch {
    return { failedLoginAttempts24h: 0, rlsViolations: 0, securityScore: 0, recentSecurityEvents: [], status: 'critical' };
  }
}

async function fetchStorageStats(): Promise<StorageMonitoring> {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();

    if (!buckets) {
      return { totalStorageUsedMB: 0, storageQuotaMB: 10000, percentageUsed: 0, buckets: [], largestFiles: [], status: 'healthy' };
    }

    const bucketStats = await Promise.all(
      buckets.map(async (bucket) => {
        try {
          const { data: files } = await supabase.storage.from(bucket.name).list();
          const fileCount = files?.length || 0;
          return { name: bucket.name, size_mb: fileCount * 0.5, file_count: fileCount };
        } catch {
          return { name: bucket.name, size_mb: 0, file_count: 0 };
        }
      })
    );

    const totalStorageUsedMB = bucketStats.reduce((sum, b) => sum + b.size_mb, 0);
    const storageQuotaMB = 10000;
    const percentageUsed = (totalStorageUsedMB / storageQuotaMB) * 100;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (percentageUsed >= 90) status = 'critical';
    else if (percentageUsed >= 75) status = 'warning';

    return { totalStorageUsedMB, storageQuotaMB, percentageUsed, buckets: bucketStats, largestFiles: [], status };
  } catch {
    return { totalStorageUsedMB: 0, storageQuotaMB: 10000, percentageUsed: 0, buckets: [], largestFiles: [], status: 'healthy' };
  }
}

async function fetchMessagesStats(): Promise<MessagesMonitoring> {
  try {
    const now = new Date();
    const last24h = subHours(now, 24).toISOString();
    const last7d = subDays(now, 7).toISOString();
    const last30d = subDays(now, 30).toISOString();

    const [threadsResult, messages24hResult, messages7dResult, messages30dResult, messagesWithUsersResult, recentResult] = await Promise.all([
      supabase.from('message_threads').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', last24h),
      supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', last7d),
      supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', last30d),
      supabase.from('messages').select('sender_id, profiles(full_name)').gte('created_at', last7d),
      supabase.from('messages').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(20),
    ]);

    const userMap = new Map<string, { name: string; count: number }>();
    messagesWithUsersResult.data?.forEach((msg: any) => {
      if (msg.sender_id && msg.profiles) {
        const existing = userMap.get(msg.sender_id);
        userMap.set(msg.sender_id, { name: msg.profiles.full_name || 'Unknown', count: (existing?.count || 0) + 1 });
      }
    });

    const mostActiveUsers = Array.from(userMap.entries())
      .map(([id, data]) => ({ user_id: id, username: data.name, message_count: data.count }))
      .sort((a, b) => b.message_count - a.message_count)
      .slice(0, 5);

    return {
      totalThreads: threadsResult.count || 0,
      messagesSent24h: messages24hResult.count || 0,
      messagesSent7d: messages7dResult.count || 0,
      messagesSent30d: messages30dResult.count || 0,
      avgResponseTimeMinutes: 0,
      activeThreads: threadsResult.count || 0,
      totalUnreadMessages: 0,
      mostActiveUsers,
      recentMessages: recentResult.data || [],
    };
  } catch {
    return { totalThreads: 0, messagesSent24h: 0, messagesSent7d: 0, messagesSent30d: 0, avgResponseTimeMinutes: 0, activeThreads: 0, totalUnreadMessages: 0, mostActiveUsers: [], recentMessages: [] };
  }
}

async function fetchDocumentsStats(): Promise<DocumentsMonitoring> {
  try {
    const now = new Date();
    const today = startOfDay(now).toISOString();
    const weekStart = startOfWeek(now).toISOString();
    const monthStart = startOfMonth(now).toISOString();

    const [totalResult, todayResult, weekResult, monthResult, categoriesResult, projectsResult, recentResult] = await Promise.all([
      supabase.from('documents').select('*', { count: 'exact', head: true }),
      supabase.from('documents').select('*', { count: 'exact', head: true }).gte('created_at', today),
      supabase.from('documents').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
      supabase.from('documents').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('documents').select('category'),
      supabase.from('documents').select('project_id, projects(name)'),
      supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(10),
    ]);

    const categoryMap = new Map<string, number>();
    categoriesResult.data?.forEach((doc: any) => {
      const cat = doc.category || 'Uncategorized';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });

    const projectMap = new Map<string, { name: string; count: number }>();
    projectsResult.data?.forEach((doc: any) => {
      if (doc.project_id && doc.projects) {
        const existing = projectMap.get(doc.project_id);
        projectMap.set(doc.project_id, { name: doc.projects.name, count: (existing?.count || 0) + 1 });
      }
    });

    const topProjects = Array.from(projectMap.entries())
      .map(([id, data]) => ({ project_id: id, project_name: data.name, document_count: data.count }))
      .sort((a, b) => b.document_count - a.document_count)
      .slice(0, 5);

    return {
      totalDocuments: totalResult.count || 0,
      uploadedToday: todayResult.count || 0,
      uploadedThisWeek: weekResult.count || 0,
      uploadedThisMonth: monthResult.count || 0,
      categoryBreakdown: Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count })),
      topProjects,
      averageSizeKB: 0,
      totalStorageMB: 0,
      failedUploads: 0,
      recentUploads: recentResult.data || [],
    };
  } catch {
    return { totalDocuments: 0, uploadedToday: 0, uploadedThisWeek: 0, uploadedThisMonth: 0, categoryBreakdown: [], topProjects: [], averageSizeKB: 0, totalStorageMB: 0, failedUploads: 0, recentUploads: [] };
  }
}

async function fetchCalendarStats(): Promise<CalendarMonitoring> {
  try {
    const now = new Date();
    const today = startOfDay(now).toISOString();
    const weekStart = startOfWeek(now).toISOString();
    const monthStart = startOfMonth(now).toISOString();

    const [totalResult, allEventsResult, upcomingResult] = await Promise.all([
      supabase.from('calendar_events').select('*', { count: 'exact', head: true }),
      supabase.from('calendar_events').select('*'),
      supabase.from('calendar_events').select('*, projects(name)').gte('start_datetime', today).order('start_datetime', { ascending: true }).limit(10),
    ]);

    const allEvents = allEventsResult.data || [];
    const eventsToday = allEvents.filter(e => e.start_datetime >= today).length;
    const eventsThisWeek = allEvents.filter(e => e.start_datetime >= weekStart).length;
    const eventsThisMonth = allEvents.filter(e => e.start_datetime >= monthStart).length;
    const overdueEvents = allEvents.filter(e => isPast(new Date(e.start_datetime)) && e.status !== 'completed').length;

    const typeMap = new Map<string, number>();
    allEvents.forEach((event: any) => {
      const type = event.category || 'Other';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });

    const projectMap = new Map<string, { name: string; count: number }>();
    allEvents.forEach((event: any) => {
      if (event.project_id) {
        const existing = projectMap.get(event.project_id);
        projectMap.set(event.project_id, { name: 'Project', count: (existing?.count || 0) + 1 });
      }
    });

    const mostBusyProjects = Array.from(projectMap.entries())
      .map(([id, data]) => ({ project_id: id, project_name: data.name, event_count: data.count }))
      .sort((a, b) => b.event_count - a.event_count)
      .slice(0, 5);

    return {
      totalEvents: totalResult.count || 0,
      eventsToday,
      eventsThisWeek,
      eventsThisMonth,
      overdueEvents,
      upcomingEvents: upcomingResult.data || [],
      eventsByType: Array.from(typeMap.entries()).map(([type, count]) => ({ type, count })),
      mostBusyProjects,
    };
  } catch {
    return { totalEvents: 0, eventsToday: 0, eventsThisWeek: 0, eventsThisMonth: 0, overdueEvents: 0, upcomingEvents: [], eventsByType: [], mostBusyProjects: [] };
  }
}

async function fetchTasksStats(): Promise<TasksMonitoring> {
  try {
    const [totalResult, allTasksResult, recentResult] = await Promise.all([
      supabase.from('todos').select('*', { count: 'exact', head: true }),
      supabase.from('todos').select('*'),
      supabase.from('todos').select('*, profiles(full_name)').order('created_at', { ascending: false }).limit(10),
    ]);

    const allTasks = allTasksResult.data || [];
    const completedTasks = allTasks.filter(t => t.completed).length;
    const pendingTasks = allTasks.filter(t => !t.completed).length;
    const overdueTasks = allTasks.filter(t => !t.completed && t.due_date && isPast(new Date(t.due_date))).length;
    const completionRate = totalResult.count ? (completedTasks / totalResult.count) * 100 : 0;

    const priorityMap = new Map<string, number>();
    allTasks.forEach((task: any) => {
      const priority = task.priority || 'medium';
      priorityMap.set(priority, (priorityMap.get(priority) || 0) + 1);
    });

    const userMap = new Map<string, { name: string; count: number }>();
    allTasks.filter(t => t.completed).forEach((task: any) => {
      if (task.user_id) {
        const existing = userMap.get(task.user_id);
        userMap.set(task.user_id, { name: 'User', count: (existing?.count || 0) + 1 });
      }
    });

    const mostProductiveUsers = Array.from(userMap.entries())
      .map(([id, data]) => ({ user_id: id, username: data.name, completed_count: data.count }))
      .sort((a, b) => b.completed_count - a.completed_count)
      .slice(0, 5);

    return {
      totalTasks: totalResult.count || 0,
      completedTasks,
      pendingTasks,
      overdueTasks,
      completionRate,
      tasksByPriority: Array.from(priorityMap.entries()).map(([priority, count]) => ({ priority, count })),
      mostProductiveUsers,
      recentTasks: recentResult.data || [],
    };
  } catch {
    return { totalTasks: 0, completedTasks: 0, pendingTasks: 0, overdueTasks: 0, completionRate: 0, tasksByPriority: [], mostProductiveUsers: [], recentTasks: [] };
  }
}

function fetchEdgeFunctionsStats(): EdgeFunctionsMonitoring {
  const mockFunctions = [
    { name: 'send-team-invitation', executionCount: 45, errorRate: 2.2, avgExecutionTime: 234 },
    { name: 'send-tender-invitation', executionCount: 23, errorRate: 0, avgExecutionTime: 189 },
    { name: 'send-rfi-notification', executionCount: 67, errorRate: 1.5, avgExecutionTime: 156 },
    { name: 'parse-line-items', executionCount: 12, errorRate: 8.3, avgExecutionTime: 892 },
    { name: 'generate-invite-link', executionCount: 34, errorRate: 0, avgExecutionTime: 123 },
  ];

  const totalExecutions = mockFunctions.reduce((sum, f) => sum + f.executionCount, 0);
  const overallErrorRate = mockFunctions.reduce((sum, f) => sum + (f.errorRate * f.executionCount), 0) / totalExecutions;

  let status: 'healthy' | 'degraded' | 'down' = 'healthy';
  if (overallErrorRate > 10) status = 'down';
  else if (overallErrorRate > 5) status = 'degraded';

  return { totalExecutions, functions: mockFunctions, overallErrorRate, status };
}

// ========== MAIN HOOK ==========

export const useSystemMonitoringHub = () => {
  const [stats, setStats] = useState<SystemMonitoringHub>({
    api: null,
    database: null,
    security: null,
    storage: null,
    messages: null,
    documents: null,
    calendar: null,
    tasks: null,
    edgeFunctions: null,
    overallHealth: 'healthy',
  });
  const [loading, setLoading] = useState(true);

  const fetchAllStats = useCallback(async () => {
    try {
      const [api, database, security, storage, messages, documents, calendar, tasks] = await Promise.all([
        fetchAPIStats(),
        fetchDatabaseStats(),
        fetchSecurityStats(),
        fetchStorageStats(),
        fetchMessagesStats(),
        fetchDocumentsStats(),
        fetchCalendarStats(),
        fetchTasksStats(),
      ]);

      const edgeFunctions = fetchEdgeFunctionsStats();

      // Calculate overall health
      const statuses = [api.status, database.status, edgeFunctions.status];
      let overallHealth: 'healthy' | 'degraded' | 'critical' = 'healthy';
      if (statuses.includes('down') || security.status === 'critical' || storage.status === 'critical') {
        overallHealth = 'critical';
      } else if (statuses.includes('degraded') || security.status === 'warning' || storage.status === 'warning') {
        overallHealth = 'degraded';
      }

      setStats({ api, database, security, storage, messages, documents, calendar, tasks, edgeFunctions, overallHealth });
    } catch (error) {
      // Silent fail - individual fetchers handle their own errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllStats();

    // Refresh every 60 seconds
    const interval = setInterval(fetchAllStats, 60000);

    // Set up real-time subscriptions for key tables
    const channels = [
      supabase.channel('monitoring-messages').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchAllStats),
      supabase.channel('monitoring-documents').on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, fetchAllStats),
      supabase.channel('monitoring-calendar').on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_events' }, fetchAllStats),
      supabase.channel('monitoring-todos').on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, fetchAllStats),
    ];

    channels.forEach(channel => channel.subscribe());

    return () => {
      clearInterval(interval);
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [fetchAllStats]);

  return { stats, loading, refetch: fetchAllStats };
};

// ========== LEGACY HOOK EXPORTS (for backwards compatibility) ==========

export const useAPIMonitoring = () => {
  const { stats, loading, refetch } = useSystemMonitoringHub();
  return { stats: stats.api, loading, refetch };
};

export const useDatabaseMonitoring = () => {
  const { stats, loading, refetch } = useSystemMonitoringHub();
  return { stats: stats.database, loading, refetch };
};

export const useSecurityMonitoring = () => {
  const { stats, loading, refetch } = useSystemMonitoringHub();
  return { stats: stats.security, loading, refetch };
};

export const useStorageMonitoring = () => {
  const { stats, loading, refetch } = useSystemMonitoringHub();
  return { stats: stats.storage, loading, refetch };
};

export const useMessagesMonitoring = () => {
  const { stats, loading, refetch } = useSystemMonitoringHub();
  return { stats: stats.messages, loading, refetch };
};

export const useDocumentsMonitoring = () => {
  const { stats, loading, refetch } = useSystemMonitoringHub();
  return { stats: stats.documents, loading, refetch };
};

export const useCalendarMonitoring = () => {
  const { stats, loading, refetch } = useSystemMonitoringHub();
  return { stats: stats.calendar, loading, refetch };
};

export const useTasksMonitoring = () => {
  const { stats, loading, refetch } = useSystemMonitoringHub();
  return { stats: stats.tasks, loading, refetch };
};

export const useEdgeFunctionsMonitoring = () => {
  const { stats, loading, refetch } = useSystemMonitoringHub();
  return { stats: stats.edgeFunctions, loading, refetch };
};

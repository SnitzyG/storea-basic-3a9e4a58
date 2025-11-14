import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SystemHealth {
  database: {
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    lastCheck: Date;
  };
  api: {
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
  };
  realtime: {
    status: 'connected' | 'disconnected';
    activeSubscriptions: number;
  };
  errors: {
    last1h: number;
    last24h: number;
    recentErrors: Array<{
      timestamp: string;
      message: string;
      severity: string;
    }>;
  };
}

export const useSystemHealth = () => {
  const [health, setHealth] = useState<SystemHealth>({
    database: {
      status: 'healthy',
      responseTime: 0,
      lastCheck: new Date(),
    },
    api: {
      status: 'healthy',
      uptime: 99.9,
    },
    realtime: {
      status: 'connected',
      activeSubscriptions: 0,
    },
    errors: {
      last1h: 0,
      last24h: 0,
      recentErrors: [],
    },
  });
  const [loading, setLoading] = useState(true);

  const checkHealth = async () => {
    try {
      setLoading(true);

      // Check database connection
      const dbStart = Date.now();
      const { error: dbError } = await supabase.from('projects').select('id').limit(1);
      const dbResponseTime = Date.now() - dbStart;

      const dbStatus: 'healthy' | 'degraded' | 'down' = dbError
        ? 'down'
        : dbResponseTime > 1000
        ? 'degraded'
        : 'healthy';

      // Check for recent errors (would query postgres_logs in production)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      setHealth({
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
          lastCheck: new Date(),
        },
        api: {
          status: 'healthy', // Would check edge functions in production
          uptime: 99.9,
        },
        realtime: {
          status: 'connected', // Would check actual connection status
          activeSubscriptions: 0,
        },
        errors: {
          last1h: 0, // Would query logs
          last24h: 0,
          recentErrors: [],
        },
      });
    } catch (error) {
      console.error('Error checking system health:', error);
      setHealth(prev => ({
        ...prev,
        database: {
          ...prev.database,
          status: 'down',
        },
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();

    // Set up real-time subscription for activity logs (errors)
    const channel = supabase
      .channel('system-health-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_log',
          filter: 'action=eq.error',
        },
        () => {
          checkHealth();
        }
      )
      .subscribe();

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  return { health, loading, refetch: checkHealth };
};

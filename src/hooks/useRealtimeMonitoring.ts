import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RealtimeMonitoring {
  activeSubscriptions: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  latencyMs: number;
  status: 'healthy' | 'degraded' | 'down';
}

export const useRealtimeMonitoring = () => {
  const [stats, setStats] = useState<RealtimeMonitoring | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const startTime = Date.now();
      
      // Test real-time connection by creating a temporary subscription
      const channel = supabase.channel('health-check');
      
      await new Promise((resolve) => {
        channel
          .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {})
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              resolve(null);
            }
          });
      });

      const latency = Date.now() - startTime;
      
      await supabase.removeChannel(channel);

      let connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected' = 'excellent';
      let status: 'healthy' | 'degraded' | 'down' = 'healthy';

      if (latency > 2000) {
        connectionQuality = 'disconnected';
        status = 'down';
      } else if (latency > 1000) {
        connectionQuality = 'poor';
        status = 'degraded';
      } else if (latency > 500) {
        connectionQuality = 'good';
      }

      // Note: Actual subscription count would require tracking in your app
      setStats({
        activeSubscriptions: 0, // Track this in your app state
        connectionQuality,
        latencyMs: latency,
        status,
      });
    } catch (error) {
      console.error('Error fetching realtime monitoring stats:', error);
      setStats({
        activeSubscriptions: 0,
        connectionQuality: 'disconnected',
        latencyMs: 0,
        status: 'down',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
};

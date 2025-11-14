import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface APIEndpointStats {
  endpoint: string;
  requestCount: number;
  avgResponseTime: number;
  errorRate: number;
}

interface APIMonitoring {
  totalRequests: number;
  avgResponseTime: number;
  errorRate: number;
  endpoints: APIEndpointStats[];
  status: 'healthy' | 'degraded' | 'down';
}

export const useAPIMonitoring = () => {
  const [stats, setStats] = useState<APIMonitoring | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Test API response time with a simple query
      const startTime = Date.now();
      await supabase.from('profiles').select('id', { count: 'exact', head: true });
      const responseTime = Date.now() - startTime;

      // Mock endpoint stats - would need analytics/logging to get real data
      const mockEndpoints: APIEndpointStats[] = [
        { endpoint: '/api/projects', requestCount: 1247, avgResponseTime: 123, errorRate: 0.8 },
        { endpoint: '/api/documents', requestCount: 892, avgResponseTime: 156, errorRate: 0.2 },
        { endpoint: '/api/messages', requestCount: 2341, avgResponseTime: 89, errorRate: 0.5 },
        { endpoint: '/api/rfis', requestCount: 567, avgResponseTime: 201, errorRate: 1.2 },
        { endpoint: '/api/tenders', requestCount: 423, avgResponseTime: 178, errorRate: 0.3 },
      ];

      const totalRequests = mockEndpoints.reduce((sum, e) => sum + e.requestCount, 0);
      const avgResponseTime = responseTime;
      const errorRate = mockEndpoints.reduce((sum, e) => sum + (e.errorRate * e.requestCount), 0) / totalRequests;

      let status: 'healthy' | 'degraded' | 'down' = 'healthy';
      if (errorRate > 5) status = 'down';
      else if (errorRate > 2 || avgResponseTime > 1000) status = 'degraded';

      setStats({
        totalRequests,
        avgResponseTime,
        errorRate,
        endpoints: mockEndpoints,
        status,
      });
    } catch (error) {
      console.error('Error fetching API monitoring stats:', error);
      setStats({
        totalRequests: 0,
        avgResponseTime: 0,
        errorRate: 100,
        endpoints: [],
        status: 'down',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, refetch: fetchStats };
};

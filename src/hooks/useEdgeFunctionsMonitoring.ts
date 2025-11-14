import { useState, useEffect } from 'react';

interface EdgeFunctionStats {
  name: string;
  executionCount: number;
  errorRate: number;
  avgExecutionTime: number;
}

interface EdgeFunctionsMonitoring {
  totalExecutions: number;
  functions: EdgeFunctionStats[];
  overallErrorRate: number;
  status: 'healthy' | 'degraded' | 'down';
}

export const useEdgeFunctionsMonitoring = () => {
  const [stats, setStats] = useState<EdgeFunctionsMonitoring | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Note: Edge function stats would typically come from Supabase Analytics
      // This is a placeholder implementation
      const mockFunctions: EdgeFunctionStats[] = [
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

      setStats({
        totalExecutions,
        functions: mockFunctions,
        overallErrorRate,
        status,
      });
    } catch (error) {
      console.error('Error fetching edge functions monitoring stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
};

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StorageMonitoring {
  totalStorageUsedMB: number;
  storageQuotaMB: number;
  percentageUsed: number;
  buckets: { name: string; size_mb: number; file_count: number }[];
  largestFiles: { name: string; size_mb: number; bucket: string }[];
  status: 'healthy' | 'warning' | 'critical';
}

export const useStorageMonitoring = () => {
  const [stats, setStats] = useState<StorageMonitoring | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Get list of all buckets
      const { data: buckets } = await supabase.storage.listBuckets();

      if (!buckets) {
        setStats({
          totalStorageUsedMB: 0,
          storageQuotaMB: 10000, // 10GB default quota
          percentageUsed: 0,
          buckets: [],
          largestFiles: [],
          status: 'healthy',
        });
        setLoading(false);
        return;
      }

      // For each bucket, get file count and size estimates
      const bucketStats = await Promise.all(
        buckets.map(async (bucket) => {
          try {
            const { data: files } = await supabase.storage.from(bucket.name).list();
            const fileCount = files?.length || 0;
            
            // Note: Supabase doesn't provide direct size info via API
            // This is an approximation - would need backend function for exact sizes
            const estimatedSizeMB = fileCount * 0.5; // Assume 500KB average per file

            return {
              name: bucket.name,
              size_mb: estimatedSizeMB,
              file_count: fileCount,
            };
          } catch (error) {
            return {
              name: bucket.name,
              size_mb: 0,
              file_count: 0,
            };
          }
        })
      );

      const totalStorageUsedMB = bucketStats.reduce((sum, b) => sum + b.size_mb, 0);
      const storageQuotaMB = 10000; // 10GB - adjust based on your plan
      const percentageUsed = (totalStorageUsedMB / storageQuotaMB) * 100;

      let status: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (percentageUsed >= 90) status = 'critical';
      else if (percentageUsed >= 75) status = 'warning';

      setStats({
        totalStorageUsedMB,
        storageQuotaMB,
        percentageUsed,
        buckets: bucketStats,
        largestFiles: [], // Would need backend function to get actual file sizes
        status,
      });
    } catch (error) {
      console.error('Error fetching storage monitoring stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Refresh every 5 minutes
    const interval = setInterval(fetchStats, 300000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
};

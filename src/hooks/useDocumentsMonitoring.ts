import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, startOfWeek, startOfMonth } from 'date-fns';

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

export const useDocumentsMonitoring = () => {
  const [stats, setStats] = useState<DocumentsMonitoring | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const today = startOfDay(now).toISOString();
      const weekStart = startOfWeek(now).toISOString();
      const monthStart = startOfMonth(now).toISOString();

      const [
        totalResult,
        todayResult,
        weekResult,
        monthResult,
        categoriesResult,
        projectsResult,
        recentResult,
      ] = await Promise.all([
        supabase.from('documents').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }).gte('created_at', today),
        supabase.from('documents').select('*', { count: 'exact', head: true }).gte('created_at', weekStart),
        supabase.from('documents').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
        supabase.from('documents').select('category'),
        supabase.from('documents').select('project_id, projects(name)'),
        supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      // Calculate category breakdown
      const categoryMap = new Map<string, number>();
      categoriesResult.data?.forEach((doc: any) => {
        const cat = doc.category || 'Uncategorized';
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });

      // Calculate top projects
      const projectMap = new Map<string, { name: string; count: number }>();
      projectsResult.data?.forEach((doc: any) => {
        if (doc.project_id && doc.projects) {
          const existing = projectMap.get(doc.project_id);
          projectMap.set(doc.project_id, {
            name: doc.projects.name,
            count: (existing?.count || 0) + 1,
          });
        }
      });

      const topProjects = Array.from(projectMap.entries())
        .map(([id, data]) => ({ project_id: id, project_name: data.name, document_count: data.count }))
        .sort((a, b) => b.document_count - a.document_count)
        .slice(0, 5);

      setStats({
        totalDocuments: totalResult.count || 0,
        uploadedToday: todayResult.count || 0,
        uploadedThisWeek: weekResult.count || 0,
        uploadedThisMonth: monthResult.count || 0,
        categoryBreakdown: Array.from(categoryMap.entries()).map(([category, count]) => ({ category, count })),
        topProjects,
        averageSizeKB: 0, // Calculate from storage if needed
        totalStorageMB: 0, // Calculate from storage if needed
        failedUploads: 0,
        recentUploads: recentResult.data || [],
      });
    } catch (error) {
      console.error('Error fetching documents monitoring stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel('documents-monitoring')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, loading, refetch: fetchStats };
};

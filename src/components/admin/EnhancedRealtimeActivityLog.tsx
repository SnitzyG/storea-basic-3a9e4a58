import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Activity } from 'lucide-react';
import { useActivity } from '@/hooks/useActivity';
import { ActivityLogFilters, ActivityFilters } from './ActivityLogFilters';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const EnhancedRealtimeActivityLog = () => {
  const { activities } = useActivity();
  const [filteredActivities, setFilteredActivities] = useState(activities);
  const [filters, setFilters] = useState<ActivityFilters>({
    search: '',
    module: 'all',
    action: 'all',
    user: '',
    severity: 'all',
  });

  useEffect(() => {
    applyFilters(activities, filters);
  }, [activities]);

  const applyFilters = (data: any[], currentFilters: ActivityFilters) => {
    let filtered = [...data];

    // Search filter
    if (currentFilters.search) {
      const searchLower = currentFilters.search.toLowerCase();
      filtered = filtered.filter(
        (activity) =>
          activity.description?.toLowerCase().includes(searchLower) ||
          activity.action?.toLowerCase().includes(searchLower) ||
          activity.entity_type?.toLowerCase().includes(searchLower)
      );
    }

    // Module filter
    if (currentFilters.module && currentFilters.module !== 'all') {
      filtered = filtered.filter((activity) =>
        activity.entity_type?.toLowerCase().includes(currentFilters.module.toLowerCase())
      );
    }

    // Action filter
    if (currentFilters.action && currentFilters.action !== 'all') {
      filtered = filtered.filter(
        (activity) => activity.action?.toLowerCase() === currentFilters.action.toLowerCase()
      );
    }

    // Date range filter
    if (currentFilters.dateRange?.from) {
      filtered = filtered.filter((activity) => {
        const activityDate = new Date(activity.created_at);
        const fromDate = currentFilters.dateRange!.from!;
        const toDate = currentFilters.dateRange!.to || new Date();
        return activityDate >= fromDate && activityDate <= toDate;
      });
    }

    setFilteredActivities(filtered);
  };

  const handleFilterChange = (newFilters: ActivityFilters) => {
    setFilters(newFilters);
    applyFilters(activities, newFilters);
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      if (format === 'csv') {
        exportToCSV();
      } else {
        exportToPDF();
      }
      toast.success(`Exported ${filteredActivities.length} activities to ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export activities');
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Module', 'Action', 'Description'];
    const rows = filteredActivities.map((activity) => [
      new Date(activity.created_at).toLocaleString(),
      activity.entity_type || 'N/A',
      activity.action || 'N/A',
      activity.description || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('Activity Log Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    doc.text(`Total Activities: ${filteredActivities.length}`, 14, 36);

    const tableData = filteredActivities.map((activity) => [
      new Date(activity.created_at).toLocaleString(),
      activity.entity_type || 'N/A',
      activity.action || 'N/A',
      activity.description || 'N/A',
    ]);

    (doc as any).autoTable({
      startY: 42,
      head: [['Timestamp', 'Module', 'Action', 'Description']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [71, 85, 105] },
    });

    doc.save(`activity-log-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const getActivityColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'project':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'document':
      case 'document_group':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'rfi':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'tender':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'message':
        return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'financial':
      case 'invoice':
      case 'payment':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'calendar':
      case 'calendar_event':
        return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
      case 'task':
      case 'todo':
        return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
      case 'user':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Activity Log
            <Badge variant="outline" className="ml-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1" />
              Live
            </Badge>
          </CardTitle>
          <Badge variant="outline">{filteredActivities.length} activities</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ActivityLogFilters onFilterChange={handleFilterChange} onExport={handleExport} />

        <ScrollArea className="h-[500px] pr-4">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No activities found matching your filters
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-transparent hover:border-border"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs">
                      {activity.action?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium capitalize">
                        {activity.action || 'Activity'}
                      </span>
                      <Badge variant="outline" className={`text-xs ${getActivityColor(activity.entity_type)}`}>
                        {activity.entity_type?.replace(/_/g, ' ') || 'General'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                    {activity.metadata && activity.entity_id && (
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        {activity.entity_type} • ID: {activity.entity_id.substring(0, 8)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuditLogs } from '@/api/admin';
import { Search, Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', actionFilter, statusFilter],
    queryFn: () => getAuditLogs({
      action: actionFilter !== 'all' ? actionFilter : undefined,
      status: statusFilter !== 'all' ? (statusFilter as any) : undefined,
    }),
  });

  const filteredLogs = logs?.filter(log =>
    log.resource_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const uniqueActions = Array.from(new Set(logs?.map(l => l.action) || []));

  const handleExportCSV = () => {
    if (!filteredLogs || filteredLogs.length === 0) return;

    const headers = ['Timestamp', 'Action', 'Resource Type', 'Resource Name', 'Status', 'Error Message'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.action,
      log.resource_type || '',
      log.resource_name || '',
      log.status,
      log.error_message || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">View all administrative actions and changes</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle>Activity Log ({filteredLogs.length})</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full sm:w-64"
                  />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map(action => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleExportCSV} variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
                  <div>Timestamp</div>
                  <div>Action</div>
                  <div>Resource Type</div>
                  <div>Resource</div>
                  <div>Status</div>
                  <div>Details</div>
                </div>
                {filteredLogs.map((log) => (
                  <div key={log.id} className="grid grid-cols-6 gap-4 py-3 items-center border-b text-sm">
                    <div className="text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, HH:mm:ss')}
                    </div>
                    <div className="font-medium">{log.action}</div>
                    <div className="text-muted-foreground">{log.resource_type || '-'}</div>
                    <div className="truncate">{log.resource_name || '-'}</div>
                    <div>
                      <Badge variant={log.status === 'success' ? 'secondary' : 'destructive'}>
                        {log.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground truncate">
                      {log.error_message || '-'}
                    </div>
                  </div>
                ))}
                {filteredLogs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No audit logs found</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

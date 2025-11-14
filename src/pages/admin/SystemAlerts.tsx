import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getAdminAlerts, markAlertAsRead, resolveAlert, deleteAlert } from '@/api/admin';
import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function SystemAlerts() {
  const { toast } = useToast();
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');

  const { data: alerts, isLoading, refetch } = useQuery({
    queryKey: ['admin-alerts-full'],
    queryFn: getAdminAlerts,
  });

  const filteredAlerts = alerts?.filter(alert => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (readFilter === 'unread' && alert.is_read) return false;
    if (readFilter === 'read' && !alert.is_read) return false;
    return true;
  }) || [];

  const handleMarkAsRead = async (alertId: string) => {
    try {
      await markAlertAsRead(alertId);
      toast({
        title: 'Alert Marked as Read',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark as read',
        variant: 'destructive',
      });
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      toast({
        title: 'Alert Resolved',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to resolve alert',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (alertId: string) => {
    try {
      await deleteAlert(alertId);
      toast({
        title: 'Alert Deleted',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete alert',
        variant: 'destructive',
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    return severity === 'critical' ? 'text-destructive' : severity === 'warning' ? 'text-yellow-500' : 'text-blue-500';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Alerts</h1>
          <p className="text-muted-foreground">Manage system notifications and warnings</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle>All Alerts ({filteredAlerts.length})</CardTitle>
              <div className="flex gap-2">
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="All Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={readFilter} onValueChange={setReadFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : filteredAlerts.length > 0 ? (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                    <AlertCircle className={`h-5 w-5 mt-0.5 ${getSeverityIcon(alert.severity)}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                        <span className="font-medium">{alert.title}</span>
                        {!alert.is_read && (
                          <Badge variant="outline" className="text-xs">Unread</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {format(new Date(alert.created_at), 'PPpp')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!alert.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkAsRead(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Read
                        </Button>
                      )}
                      {!alert.resolved_at && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleResolve(alert.id)}
                        >
                          Resolve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(alert.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No alerts found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

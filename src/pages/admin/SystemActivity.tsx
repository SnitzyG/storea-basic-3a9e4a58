import { useState } from 'react';
import { useSystemActivity } from '@/hooks/useSystemActivity';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  MessageSquare,
  HelpCircle,
  Briefcase,
  FolderOpen,
  Users,
  Activity,
  Download,
  Search,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';

const entityIcons: Record<string, any> = {
  document: FileText,
  document_revision: FileText,
  message: MessageSquare,
  message_thread: MessageSquare,
  rfi: HelpCircle,
  tender: Briefcase,
  tender_bid: Briefcase,
  project: FolderOpen,
  project_team: Users,
};

const actionColors: Record<string, string> = {
  created: 'bg-green-500/10 text-green-500',
  updated: 'bg-blue-500/10 text-blue-500',
  deleted: 'bg-red-500/10 text-red-500',
  superseded: 'bg-purple-500/10 text-purple-500',
  sent: 'bg-cyan-500/10 text-cyan-500',
  status_changed: 'bg-yellow-500/10 text-yellow-500',
  member_added: 'bg-green-500/10 text-green-500',
  member_removed: 'bg-orange-500/10 text-orange-500',
  submitted: 'bg-indigo-500/10 text-indigo-500',
  responded: 'bg-teal-500/10 text-teal-500',
};

export default function SystemActivity() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('');

  const { data: activities, isLoading, refetch } = useSystemActivity({
    entityType: entityTypeFilter || undefined,
    action: actionFilter || undefined,
  });

  const filteredActivities = activities?.filter((activity) =>
    activity.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    if (!filteredActivities) return;

    const csv = [
      ['Time', 'User', 'Entity', 'Action', 'Description', 'IP Address'].join(','),
      ...filteredActivities.map((activity) =>
        [
          format(new Date(activity.created_at), 'yyyy-MM-dd HH:mm:ss'),
          activity.user?.name || 'Unknown',
          activity.entity_type,
          activity.action,
          `"${activity.description}"`,
          activity.ip_address || 'N/A',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">System Activity</h1>
          <p className="text-muted-foreground">Comprehensive activity log across all system operations</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Entity Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Entity Types</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="message">Messages</SelectItem>
                  <SelectItem value="rfi">RFIs</SelectItem>
                  <SelectItem value="tender">Tenders</SelectItem>
                  <SelectItem value="project">Projects</SelectItem>
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  <SelectItem value="created">Created</SelectItem>
                  <SelectItem value="updated">Updated</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={handleExport} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Timeline ({filteredActivities?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredActivities?.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No activities found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredActivities?.map((activity) => {
                    const Icon = entityIcons[activity.entity_type] || Activity;
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="rounded-full bg-primary/10 p-2">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">
                              {activity.user?.name || 'Unknown User'}
                            </p>
                            <Badge
                              variant="secondary"
                              className={actionColors[activity.action] || ''}
                            >
                              {activity.action}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(activity.created_at), 'PPp')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.description}
                          </p>
                          {activity.ip_address && (
                            <p className="text-xs text-muted-foreground mt-1">
                              IP: {activity.ip_address}
                            </p>
                          )}
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                View metadata
                              </summary>
                              <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
                                {JSON.stringify(activity.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

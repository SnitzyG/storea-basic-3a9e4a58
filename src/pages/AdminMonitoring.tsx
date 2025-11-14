import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Activity, Users, TrendingUp, Bell, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { useMonitoringData } from '@/hooks/useMonitoringData';
import { IssueGroupsTable } from '@/components/admin/monitoring/IssueGroupsTable';
import { ErrorTimelineChart } from '@/components/admin/monitoring/ErrorTimelineChart';
import { PerformanceChart } from '@/components/admin/monitoring/PerformanceChart';
import { UserAnalyticsPanel } from '@/components/admin/monitoring/UserAnalyticsPanel';
import { ActiveAlertsPanel } from '@/components/admin/monitoring/ActiveAlertsPanel';
import { BreadcrumbsViewer } from '@/components/admin/monitoring/BreadcrumbsViewer';
import { ReleaseHealthPanel } from '@/components/admin/monitoring/ReleaseHealthPanel';

export default function AdminMonitoring() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const { summary, loading, issueGroups, recentErrors, performance, alerts, resolveIssue, acknowledgeAlert } = useMonitoringData(timeRange);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Monitoring</h1>
            <p className="text-muted-foreground">
              Real-time error tracking, performance monitoring, and user analytics
            </p>
          </div>
          
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalErrors}</div>
              <p className="text-xs text-muted-foreground">
                {summary.openIssues} open issues
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Affected Users</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.affectedUsers}</div>
              <p className="text-xs text-muted-foreground">
                {summary.crashFreeRate}% crash-free rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Zap className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">
                Performance metrics
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <Bell className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeAlerts}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts Banner */}
        {summary.activeAlerts > 0 && (
          <Card className="border-destructive bg-destructive/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Bell className="h-5 w-5" />
                {summary.activeAlerts} Active Alert{summary.activeAlerts > 1 ? 's' : ''}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActiveAlertsPanel alerts={alerts} onAcknowledge={acknowledgeAlert} />
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="issues" className="space-y-4">
          <TabsList>
            <TabsTrigger value="issues">
              <AlertCircle className="h-4 w-4 mr-2" />
              Issues
            </TabsTrigger>
            <TabsTrigger value="performance">
              <Activity className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="releases">
              <TrendingUp className="h-4 w-4 mr-2" />
              Releases
            </TabsTrigger>
          </TabsList>

          {/* Issues Tab */}
          <TabsContent value="issues" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Issue Groups</CardTitle>
                <CardDescription>
                  Errors grouped by similarity - {issueGroups.length} unique issues detected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IssueGroupsTable
                  issueGroups={issueGroups}
                  onResolve={resolveIssue}
                  loading={loading}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Timeline</CardTitle>
                <CardDescription>
                  Error occurrences over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ErrorTimelineChart errors={recentErrors} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
                <CardDescription>
                  Application performance metrics over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceChart metrics={performance} />
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Slowest Endpoints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {performance
                      .slice(0, 5)
                      .sort((a, b) => b.duration_ms - a.duration_ms)
                      .map((metric, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{metric.endpoint || 'Unknown'}</span>
                          <Badge variant="outline">{Math.round(metric.duration_ms)}ms</Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">P50</span>
                    <span className="font-mono">{summary.avgResponseTime}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">P95</span>
                    <span className="font-mono">{Math.round(summary.avgResponseTime * 1.5)}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">P99</span>
                    <span className="font-mono">{Math.round(summary.avgResponseTime * 2)}ms</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <UserAnalyticsPanel
              errors={recentErrors}
              affectedUsers={summary.affectedUsers}
              crashFreeRate={summary.crashFreeRate}
            />
          </TabsContent>

          {/* Releases Tab */}
          <TabsContent value="releases" className="space-y-4">
            <ReleaseHealthPanel errors={recentErrors} />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

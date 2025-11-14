import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Users, Bell, Zap, Database, Trash2 } from 'lucide-react';
import { useMonitoringData } from '@/hooks/useMonitoringData';
import { IssueGroupsTable } from '@/components/admin/monitoring/IssueGroupsTable';
import { ErrorTimelineChart } from '@/components/admin/monitoring/ErrorTimelineChart';
import { PerformanceChart } from '@/components/admin/monitoring/PerformanceChart';
import { UserAnalyticsPanel } from '@/components/admin/monitoring/UserAnalyticsPanel';
import { ActiveAlertsPanel } from '@/components/admin/monitoring/ActiveAlertsPanel';
import { ReleaseHealthPanel } from '@/components/admin/monitoring/ReleaseHealthPanel';
import { generateDemoMonitoringData, clearDemoMonitoringData } from '@/utils/monitoringDemoData';
import { useToast } from '@/hooks/use-toast';

export default function AdminMonitoring() {
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [releaseFilter, setReleaseFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  
  const { summary, loading, issueGroups, recentErrors, performance, alerts, resolveIssue, acknowledgeAlert, refetch } = useMonitoringData(timeRange);

  const filteredErrors = recentErrors.filter(error => {
    if (environmentFilter !== 'all' && error.environment !== environmentFilter) return false;
    if (releaseFilter !== 'all' && error.release_version !== releaseFilter) return false;
    return true;
  });

  const environments = ['all', ...new Set(recentErrors.map(e => e.environment).filter(Boolean))];
  const releases = ['all', ...new Set(recentErrors.map(e => e.release_version).filter(Boolean))];
  const hasData = issueGroups.length > 0 || recentErrors.length > 0 || performance.length > 0;

  const handleGenerateDemo = async () => {
    setIsGenerating(true);
    try {
      await generateDemoMonitoringData();
      toast({ title: 'Demo data generated', description: 'Monitoring dashboard populated with sample data' });
      refetch();
    } catch (error) {
      toast({ title: 'Failed to generate demo data', description: 'Check console for details', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearDemo = async () => {
    setIsGenerating(true);
    try {
      await clearDemoMonitoringData();
      toast({ title: 'Demo data cleared', description: 'All sample data has been removed' });
      refetch();
    } catch (error) {
      toast({ title: 'Failed to clear demo data', description: 'Check console for details', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Platform Monitoring</h1>
            <p className="text-muted-foreground">Real-time error tracking, performance monitoring, and user analytics</p>
          </div>
          <Select value={timeRange} onValueChange={(v: any) => setTimeRange(v)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!hasData && (
          <Card className="border-dashed bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Demo Mode: No Live Telemetry Detected</CardTitle>
              <CardDescription>Generate sample monitoring data to explore the dashboard features</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button onClick={handleGenerateDemo} disabled={isGenerating}><Database className="h-4 w-4 mr-2" />Generate Demo Data</Button>
            </CardContent>
          </Card>
        )}

        {hasData && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClearDemo} disabled={isGenerating}><Trash2 className="h-4 w-4 mr-2" />Clear Demo Data</Button>
            <Select value={environmentFilter} onValueChange={setEnvironmentFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Environment" /></SelectTrigger>
              <SelectContent>{environments.map(env => <SelectItem key={env} value={env}>{env === 'all' ? 'All Environments' : env}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={releaseFilter} onValueChange={setReleaseFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Release" /></SelectTrigger>
              <SelectContent>{releases.map(rel => <SelectItem key={rel} value={rel}>{rel === 'all' ? 'All Releases' : rel}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Errors</CardTitle><AlertCircle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.totalErrors}</div><p className="text-xs text-muted-foreground">{summary.openIssues} open issues</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Affected Users</CardTitle><Users className="h-4 w-4 text-orange-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.affectedUsers}</div><p className="text-xs text-muted-foreground">{summary.crashFreeRate}% crash-free rate</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Avg Response Time</CardTitle><Zap className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.avgResponseTime}ms</div><p className="text-xs text-muted-foreground">Performance metrics</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Active Alerts</CardTitle><Bell className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{summary.activeAlerts}</div><p className="text-xs text-muted-foreground">Requires attention</p></CardContent></Card>
        </div>

        {alerts.length > 0 && <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Active Alerts</CardTitle></CardHeader><CardContent><ActiveAlertsPanel alerts={alerts} onAcknowledge={acknowledgeAlert} /></CardContent></Card>}

        <Tabs defaultValue="issues" className="space-y-4">
          <TabsList><TabsTrigger value="issues">Issues</TabsTrigger><TabsTrigger value="performance">Performance</TabsTrigger><TabsTrigger value="users">Users</TabsTrigger><TabsTrigger value="releases">Releases</TabsTrigger></TabsList>
          <TabsContent value="issues" className="space-y-4">
            <Card><CardHeader><CardTitle>Issue Groups</CardTitle><CardDescription>Grouped errors by fingerprint</CardDescription></CardHeader><CardContent>{issueGroups.length > 0 ? <IssueGroupsTable issueGroups={issueGroups} onResolve={resolveIssue} loading={loading} /> : <p className="text-muted-foreground text-center py-8">No issues found</p>}</CardContent></Card>
            <Card><CardHeader><CardTitle>Error Timeline</CardTitle><CardDescription>Error occurrences over time</CardDescription></CardHeader><CardContent>{filteredErrors.length > 0 ? <ErrorTimelineChart errors={filteredErrors} /> : <p className="text-muted-foreground text-center py-8">No error data available</p>}</CardContent></Card>
          </TabsContent>
          <TabsContent value="performance" className="space-y-4">
            <Card><CardHeader><CardTitle>Performance Metrics</CardTitle><CardDescription>Response times and throughput</CardDescription></CardHeader><CardContent>{performance.length > 0 ? <PerformanceChart metrics={performance} /> : <p className="text-muted-foreground text-center py-8">No performance data available</p>}</CardContent></Card>
          </TabsContent>
          <TabsContent value="users" className="space-y-4">{filteredErrors.length > 0 ? <UserAnalyticsPanel errors={filteredErrors} affectedUsers={summary.affectedUsers} crashFreeRate={summary.crashFreeRate} /> : <Card><CardContent className="py-8"><p className="text-muted-foreground text-center">No user analytics available</p></CardContent></Card>}</TabsContent>
          <TabsContent value="releases" className="space-y-4">{filteredErrors.length > 0 ? <ReleaseHealthPanel errors={filteredErrors} /> : <Card><CardContent className="py-8"><p className="text-muted-foreground text-center">No release data available</p></CardContent></Card>}</TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart,
  ScatterChart, Scatter
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, Users, FileText, 
  AlertTriangle, CheckCircle, Download, Filter,
  Calendar, Building, Target, Zap, BarChart3,
  PieChart as PieChartIcon, Activity, Eye
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { RFI } from '@/hooks/useRFIs';
import { cn } from '@/lib/utils';

interface RFIAnalyticsDashboardProps {
  rfis: RFI[];
  projectUsers: any[];
  className?: string;
}

type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';
type MetricType = 'volume' | 'performance' | 'trends' | 'teams';

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#6366f1',
  secondary: '#8b5cf6'
};

const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.info, COLORS.secondary];

export const RFIAnalyticsDashboard: React.FC<RFIAnalyticsDashboardProps> = ({
  rfis,
  projectUsers,
  className
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('volume');
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed'>('overview');

  // Filter RFIs by time range
  const filteredRFIs = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '1y':
        startDate = subDays(now, 365);
        break;
      case 'all':
      default:
        return rfis;
    }

    return rfis.filter(rfi => new Date(rfi.created_at) >= startDate);
  }, [rfis, timeRange]);

  // Key Performance Indicators
  const kpis = useMemo(() => {
    const total = filteredRFIs.length;
    const answered = filteredRFIs.filter(rfi => rfi.status === 'answered').length;
    const overdue = filteredRFIs.filter(rfi => rfi.status === 'overdue').length;
    const outstanding = filteredRFIs.filter(rfi => rfi.status === 'outstanding').length;
    const avgResponseTime = filteredRFIs
      .filter(rfi => rfi.response_date && rfi.created_at)
      .reduce((acc, rfi) => {
        const created = new Date(rfi.created_at);
        const responded = new Date(rfi.response_date!);
        return acc + (responded.getTime() - created.getTime());
      }, 0) / filteredRFIs.filter(rfi => rfi.response_date).length;

    const responseRate = total > 0 ? (answered / total) * 100 : 0;
    const overdueRate = total > 0 ? (overdue / total) * 100 : 0;

    return {
      total,
      answered,
      overdue,
      outstanding,
      responseRate,
      overdueRate,
      avgResponseTime: avgResponseTime ? Math.round(avgResponseTime / (1000 * 60 * 60 * 24)) : 0, // in days
    };
  }, [filteredRFIs]);

  // Status distribution data
  const statusData = useMemo(() => {
    const statusCounts = filteredRFIs.reduce((acc, rfi) => {
      acc[rfi.status] = (acc[rfi.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
      value: count,
      percentage: Math.round((count / filteredRFIs.length) * 100)
    }));
  }, [filteredRFIs]);

  // Priority distribution data
  const priorityData = useMemo(() => {
    const priorityCounts = filteredRFIs.reduce((acc, rfi) => {
      acc[rfi.priority] = (acc[rfi.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(priorityCounts).map(([priority, count]) => ({
      name: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: count,
      percentage: Math.round((count / filteredRFIs.length) * 100)
    }));
  }, [filteredRFIs]);

  // Category analysis
  const categoryData = useMemo(() => {
    const categoryCounts = filteredRFIs.reduce((acc, rfi) => {
      const category = rfi.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / filteredRFIs.length) * 100)
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredRFIs]);

  // Time series data for trends
  const timeSeriesData = useMemo(() => {
    if (filteredRFIs.length === 0) return [];

    const now = new Date();
    const startDate = timeRange === 'all' ? 
      new Date(Math.min(...filteredRFIs.map(rfi => new Date(rfi.created_at).getTime()))) :
      subDays(now, timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365);

    const days = eachDayOfInterval({ start: startDate, end: now });
    
    return days.map(day => {
      const dayStart = new Date(day.setHours(0, 0, 0, 0));
      const dayEnd = new Date(day.setHours(23, 59, 59, 999));
      
      const created = filteredRFIs.filter(rfi => {
        const rfiDate = new Date(rfi.created_at);
        return rfiDate >= dayStart && rfiDate <= dayEnd;
      }).length;

      const answered = filteredRFIs.filter(rfi => {
        const responseDate = rfi.response_date ? new Date(rfi.response_date) : null;
        return responseDate && responseDate >= dayStart && responseDate <= dayEnd;
      }).length;

      return {
        date: format(day, 'MMM dd'),
        created,
        answered,
        outstanding: created - answered
      };
    });
  }, [filteredRFIs, timeRange]);

  // Team performance data
  const teamPerformanceData = useMemo(() => {
    const userStats = projectUsers.map(user => {
      const userRFIs = filteredRFIs.filter(rfi => rfi.raised_by === user.user_id);
      const assignedRFIs = filteredRFIs.filter(rfi => rfi.assigned_to === user.user_id);
      const answeredRFIs = assignedRFIs.filter(rfi => rfi.status === 'answered');
      
      return {
        name: user.user_profile?.name || 'Unknown',
        role: user.user_profile?.role || user.role,
        created: userRFIs.length,
        assigned: assignedRFIs.length,
        answered: answeredRFIs.length,
        responseRate: assignedRFIs.length > 0 ? Math.round((answeredRFIs.length / assignedRFIs.length) * 100) : 0
      };
    }).filter(user => user.created > 0 || user.assigned > 0);

    return userStats.sort((a, b) => (b.created + b.assigned) - (a.created + a.assigned));
  }, [filteredRFIs, projectUsers]);

  // Response time analysis
  const responseTimeData = useMemo(() => {
    const responseTimes = filteredRFIs
      .filter(rfi => rfi.response_date && rfi.created_at)
      .map(rfi => {
        const created = new Date(rfi.created_at);
        const responded = new Date(rfi.response_date!);
        const days = Math.round((responded.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: rfi.id,
          days,
          priority: rfi.priority,
          category: rfi.category || 'Other'
        };
      });

    // Group by response time ranges
    const ranges = [
      { name: 'Same Day', min: 0, max: 0 },
      { name: '1-2 Days', min: 1, max: 2 },
      { name: '3-7 Days', min: 3, max: 7 },
      { name: '1-2 Weeks', min: 8, max: 14 },
      { name: '2+ Weeks', min: 15, max: Infinity }
    ];

    return ranges.map(range => ({
      range: range.name,
      count: responseTimes.filter(rt => rt.days >= range.min && rt.days <= range.max).length
    }));
  }, [filteredRFIs]);

  const exportData = () => {
    const exportObject = {
      summary: kpis,
      timeRange,
      generatedAt: new Date().toISOString(),
      statusDistribution: statusData,
      priorityDistribution: priorityData,
      categoryAnalysis: categoryData,
      teamPerformance: teamPerformanceData,
      responseTimes: responseTimeData,
      trends: timeSeriesData
    };

    const dataStr = JSON.stringify(exportObject, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `rfi-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'primary' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
    color?: string;
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <Icon className={cn("h-4 w-4", `text-${color}-600`)} />
        </div>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
              <span>{subtitle}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">RFI Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into RFI performance and trends</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total RFIs"
          value={kpis.total}
          subtitle={`${timeRange === 'all' ? 'All time' : `Last ${timeRange}`}`}
          icon={FileText}
          color="blue"
        />
        <MetricCard
          title="Response Rate"
          value={`${Math.round(kpis.responseRate)}%`}
          subtitle={`${kpis.answered} of ${kpis.total} answered`}
          icon={CheckCircle}
          trend={kpis.responseRate >= 80 ? 'up' : kpis.responseRate >= 60 ? 'neutral' : 'down'}
          color="green"
        />
        <MetricCard
          title="Avg Response Time"
          value={`${kpis.avgResponseTime} days`}
          subtitle="From creation to response"
          icon={Clock}
          trend={kpis.avgResponseTime <= 3 ? 'up' : kpis.avgResponseTime <= 7 ? 'neutral' : 'down'}
          color="yellow"
        />
        <MetricCard
          title="Overdue RFIs"
          value={kpis.overdue}
          subtitle={`${Math.round(kpis.overdueRate)}% of total`}
          icon={AlertTriangle}
          trend={kpis.overdueRate <= 10 ? 'up' : kpis.overdueRate <= 25 ? 'neutral' : 'down'}
          color="red"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChartIcon className="h-5 w-5" />
                  <span>Status Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Priority Distribution</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {priorityData.map((item, index) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span>{item.value} ({item.percentage}%)</span>
                      </div>
                      <Progress 
                        value={item.percentage} 
                        className="h-2"
                        // style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Response Time Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Response Time Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>RFI Volume Trends</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="created" 
                      stackId="1"
                      stroke={COLORS.primary} 
                      fill={COLORS.primary}
                      fillOpacity={0.6}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="answered" 
                      stackId="2"
                      stroke={COLORS.success} 
                      fill={COLORS.success}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Category Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryData.map((category, index) => (
                  <div key={category.category} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{category.category}</h4>
                      <p className="text-sm text-muted-foreground">{category.count} RFIs ({category.percentage}%)</p>
                    </div>
                    <Badge variant="outline">{category.count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Team Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamPerformanceData.map((user, index) => (
                  <div key={user.name} className="grid grid-cols-5 gap-4 p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{user.created}</p>
                      <p className="text-xs text-muted-foreground">Created</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{user.assigned}</p>
                      <p className="text-xs text-muted-foreground">Assigned</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{user.answered}</p>
                      <p className="text-xs text-muted-foreground">Answered</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{user.responseRate}%</p>
                      <p className="text-xs text-muted-foreground">Response Rate</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Response Rate</span>
                    <span className="font-medium">{Math.round(kpis.responseRate)}%</span>
                  </div>
                  <Progress value={kpis.responseRate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>On-Time Completion</span>
                    <span className="font-medium">{Math.round(100 - kpis.overdueRate)}%</span>
                  </div>
                  <Progress value={100 - kpis.overdueRate} className="h-2" />
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Key Insights</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={cn("w-2 h-2 rounded-full", 
                        kpis.responseRate >= 80 ? "bg-green-500" : "bg-yellow-500"
                      )} />
                      <span>Response rate is {kpis.responseRate >= 80 ? 'excellent' : 'needs improvement'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={cn("w-2 h-2 rounded-full",
                        kpis.avgResponseTime <= 3 ? "bg-green-500" : kpis.avgResponseTime <= 7 ? "bg-yellow-500" : "bg-red-500"
                      )} />
                      <span>Average response time is {kpis.avgResponseTime <= 3 ? 'excellent' : kpis.avgResponseTime <= 7 ? 'good' : 'slow'}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {kpis.overdueRate > 20 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>High overdue rate:</strong> Consider implementing automated reminders or escalation procedures.
                    </p>
                  </div>
                )}
                
                {kpis.avgResponseTime > 7 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Slow response times:</strong> Review assignment processes and consider team workload balance.
                    </p>
                  </div>
                )}

                {kpis.responseRate >= 80 && kpis.avgResponseTime <= 3 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Excellent performance:</strong> Your team is responding efficiently to RFIs.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
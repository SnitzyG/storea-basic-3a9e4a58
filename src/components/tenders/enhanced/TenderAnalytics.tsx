import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock, 
  Award,
  AlertCircle,
  CheckCircle,
  Calendar,
  Package
} from 'lucide-react';
import { EnhancedTender } from '@/hooks/useEnhancedTenders';
import { format, subDays, isAfter, isBefore } from 'date-fns';

interface TenderAnalyticsProps {
  tenders: EnhancedTender[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export const TenderAnalytics = ({ tenders }: TenderAnalyticsProps) => {
  const analyticsData = useMemo(() => {
    // Basic statistics
    const totalTenders = tenders.length;
    const totalBids = tenders.reduce((sum, t) => sum + (t.bid_count || 0), 0);
    const avgBidsPerTender = totalTenders > 0 ? totalBids / totalTenders : 0;
    const totalBudget = tenders.reduce((sum, t) => sum + (t.budget || 0), 0);
    const awardedBudget = tenders
      .filter(t => t.status === 'awarded')
      .reduce((sum, t) => sum + (t.budget || 0), 0);

    // Status distribution
    const statusDistribution = tenders.reduce((acc, tender) => {
      acc[tender.status] = (acc[tender.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Type distribution
    const typeDistribution = tenders.reduce((acc, tender) => {
      acc[tender.tender_type] = (acc[tender.tender_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Bid distribution by tender
    const bidDistributionData = tenders.map(tender => ({
      name: tender.title.substring(0, 20) + '...',
      bids: tender.bid_count || 0,
      budget: tender.budget || 0,
    }));

    // Timeline analysis
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const tendersLast30Days = tenders.filter(t => 
      isAfter(new Date(t.created_at), thirtyDaysAgo)
    );

    // Tender creation timeline
    const timelineData = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(now, 29 - i);
      const dayTenders = tendersLast30Days.filter(t =>
        format(new Date(t.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );
      return {
        date: format(date, 'MMM dd'),
        tenders: dayTenders.length,
        bids: dayTenders.reduce((sum, t) => sum + (t.bid_count || 0), 0),
      };
    });

    // Performance metrics
    const completionRate = totalTenders > 0 ? 
      (tenders.filter(t => t.status === 'awarded').length / totalTenders * 100) : 0;
    
    const avgDaysToAward = tenders
      .filter(t => t.status === 'awarded')
      .reduce((sum, t, _, arr) => {
        const daysDiff = Math.ceil(
          (new Date().getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + daysDiff / arr.length;
      }, 0);

    // Upcoming deadlines
    const upcomingDeadlines = tenders
      .filter(t => t.status === 'open' && isAfter(new Date(t.deadline), now))
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);

    // Package performance
    const packagePerformance = tenders
      .filter(t => t.package)
      .reduce((acc, tender) => {
        const packageName = tender.package!.name;
        if (!acc[packageName]) {
          acc[packageName] = { tenders: 0, bids: 0, budget: 0 };
        }
        acc[packageName].tenders += 1;
        acc[packageName].bids += tender.bid_count || 0;
        acc[packageName].budget += tender.budget || 0;
        return acc;
      }, {} as Record<string, { tenders: number; bids: number; budget: number }>);

    return {
      totalTenders,
      totalBids,
      avgBidsPerTender,
      totalBudget,
      awardedBudget,
      statusDistribution,
      typeDistribution,
      bidDistributionData,
      timelineData,
      completionRate,
      avgDaysToAward,
      upcomingDeadlines,
      packagePerformance,
    };
  }, [tenders]);

  const statusChartData = Object.entries(analyticsData.statusDistribution).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }));

  const typeChartData = Object.entries(analyticsData.typeDistribution).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
  }));

  const packageChartData = Object.entries(analyticsData.packagePerformance).map(([name, data]) => ({
    name: name.substring(0, 15) + (name.length > 15 ? '...' : ''),
    tenders: data.tenders,
    bids: data.bids,
    budget: data.budget,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Competition Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.avgBidsPerTender.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              Average bids per tender
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.totalBudget > 0 ? 
                Math.round(analyticsData.awardedBudget / analyticsData.totalBudget * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              ${analyticsData.awardedBudget.toLocaleString()} awarded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Tenders awarded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Award</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(analyticsData.avgDaysToAward)}
            </div>
            <p className="text-xs text-muted-foreground">
              Days on average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tender Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tender Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Tender Activity (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analyticsData.timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="tenders" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  name="New Tenders"
                />
                <Area 
                  type="monotone" 
                  dataKey="bids" 
                  stackId="1" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  name="New Bids"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bid Competition */}
        <Card>
          <CardHeader>
            <CardTitle>Bid Competition by Tender</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.bidDistributionData.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bids" fill="#8884d8" name="Number of Bids" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Package Performance */}
      {packageChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Package</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={packageChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => {
                  if (name === 'budget') return [`$${Number(value).toLocaleString()}`, 'Total Budget'];
                  return [value, name === 'tenders' ? 'Tender Count' : 'Total Bids'];
                }} />
                <Bar dataKey="tenders" fill="#8884d8" name="tenders" />
                <Bar dataKey="bids" fill="#82ca9d" name="bids" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deadlines */}
      {analyticsData.upcomingDeadlines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.upcomingDeadlines.map(tender => {
                const daysUntilDeadline = Math.ceil(
                  (new Date(tender.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={tender.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{tender.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {tender.bid_count || 0} bids received
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={daysUntilDeadline <= 3 ? 'destructive' : daysUntilDeadline <= 7 ? 'default' : 'secondary'}>
                        {daysUntilDeadline} days
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(tender.deadline), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
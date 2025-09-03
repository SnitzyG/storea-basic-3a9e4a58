import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Users
} from 'lucide-react';
import { RFI } from '@/hooks/useRFIs';

interface RFIAnalyticsProps {
  rfis: RFI[];
}

export const RFIAnalytics = ({ rfis }: RFIAnalyticsProps) => {
  // Calculate metrics
  const totalRFIs = rfis.length;
  const openRFIs = rfis.filter(rfi => rfi.status !== 'closed').length;
  const closedRFIs = rfis.filter(rfi => rfi.status === 'closed').length;
  const overdueRFIs = rfis.filter(rfi => 
    rfi.due_date && 
    new Date(rfi.due_date) < new Date() && 
    rfi.status !== 'closed'
  ).length;
  const criticalRFIs = rfis.filter(rfi => rfi.priority === 'critical').length;
  const unassignedRFIs = rfis.filter(rfi => !rfi.assigned_to).length;

  // Status breakdown
  const statusCounts = {
    submitted: rfis.filter(rfi => rfi.status === 'submitted').length,
    in_review: rfis.filter(rfi => rfi.status === 'in_review').length,
    responded: rfis.filter(rfi => rfi.status === 'responded').length,
    closed: rfis.filter(rfi => rfi.status === 'closed').length,
  };

  // Priority breakdown
  const priorityCounts = {
    critical: rfis.filter(rfi => rfi.priority === 'critical').length,
    high: rfis.filter(rfi => rfi.priority === 'high').length,
    medium: rfis.filter(rfi => rfi.priority === 'medium').length,
    low: rfis.filter(rfi => rfi.priority === 'low').length,
  };

  // Category breakdown
  const categoryMap = new Map<string, number>();
  rfis.forEach(rfi => {
    if (rfi.category) {
      categoryMap.set(rfi.category, (categoryMap.get(rfi.category) || 0) + 1);
    }
  });
  const topCategories = Array.from(categoryMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const completionRate = totalRFIs > 0 ? (closedRFIs / totalRFIs) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total RFIs</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRFIs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open RFIs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRFIs}</div>
            {overdueRFIs > 0 && (
              <Badge variant="destructive" className="mt-1">
                {overdueRFIs} overdue
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalRFIs}</div>
            {unassignedRFIs > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {unassignedRFIs} unassigned
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Submitted</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${totalRFIs > 0 ? (statusCounts.submitted / totalRFIs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8">{statusCounts.submitted}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">In Review</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${totalRFIs > 0 ? (statusCounts.in_review / totalRFIs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8">{statusCounts.in_review}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Responded</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${totalRFIs > 0 ? (statusCounts.responded / totalRFIs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8">{statusCounts.responded}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Closed</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-muted rounded-full h-2">
                  <div 
                    className="bg-gray-500 h-2 rounded-full" 
                    style={{ width: `${totalRFIs > 0 ? (statusCounts.closed / totalRFIs) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8">{statusCounts.closed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority & Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Priority & Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Priority */}
            <div>
              <h4 className="font-medium mb-2">Priority Distribution</h4>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-red-500/10 text-red-700 border-red-500/20">
                  Critical: {priorityCounts.critical}
                </Badge>
                <Badge className="bg-orange-500/10 text-orange-700 border-orange-500/20">
                  High: {priorityCounts.high}
                </Badge>
                <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">
                  Medium: {priorityCounts.medium}
                </Badge>
                <Badge className="bg-green-500/10 text-green-700 border-green-500/20">
                  Low: {priorityCounts.low}
                </Badge>
              </div>
            </div>

            {/* Top Categories */}
            {topCategories.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Top Categories</h4>
                <div className="space-y-2">
                  {topCategories.map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="text-sm">{category}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
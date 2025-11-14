import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, AlertTriangle, Users, Clock, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTelemetryAnalytics } from '@/hooks/useTelemetryAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const TelemetryOverviewCard = () => {
  const { analytics, loading } = useTelemetryAnalytics('7d');
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Telemetry & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const topErrors = analytics.topErrors || [];
  const criticalErrors = topErrors.filter(e => e.severity === 'critical').length;
  const highErrors = topErrors.filter(e => e.severity === 'high').length;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Telemetry & Analytics
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Last 7 Days
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-blue-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Active Users</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{analytics.uniqueUsers}</div>
          </div>
          
          <div className="p-3 rounded-lg bg-green-500/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Page Views</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{analytics.totalPageViews.toLocaleString()}</div>
          </div>
          
          <div className="p-3 rounded-lg bg-purple-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-xs text-muted-foreground">Avg Session</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {Math.floor(analytics.avgSessionDuration / 60)}m
            </div>
          </div>
          
          <div className="p-3 rounded-lg bg-orange-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="text-xs text-muted-foreground">Avg Load</span>
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {analytics.avgApiResponseTime || 0}ms
            </div>
          </div>
        </div>

        {/* Error Summary */}
        {topErrors.length > 0 && (
          <div className="p-3 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Error Summary
              </span>
              <span className="text-xs text-muted-foreground">
                {analytics.errorRate.toFixed(2)}% error rate
              </span>
            </div>
            <div className="space-y-1">
              {criticalErrors > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="destructive" className="text-xs">Critical</Badge>
                  <span className="font-medium">{criticalErrors}</span>
                </div>
              )}
              {highErrors > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <Badge variant="destructive" className="text-xs bg-orange-500">High</Badge>
                  <span className="font-medium">{highErrors}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                Total: {topErrors.reduce((sum, e) => sum + e.count, 0)} errors
              </div>
            </div>
          </div>
        )}

        {/* Top Features */}
        {analytics.featureUsage.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Top Features Used</h4>
            <div className="space-y-1">
              {analytics.featureUsage.slice(0, 3).map((feature, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate flex-1">{feature.feature}</span>
                  <span className="font-medium ml-2">{feature.usage}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Details Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => navigate('/admin/telemetry')}
        >
          View Detailed Analytics
        </Button>
      </CardContent>
    </Card>
  );
};

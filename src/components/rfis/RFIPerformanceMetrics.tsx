import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Calendar, Users, FileText, 
  Clock, Target, Download, Building, Zap, ArrowUp, ArrowDown
} from 'lucide-react';
import { format, subDays, subMonths, startOfWeek, endOfWeek, eachWeekOfInterval, eachDayOfInterval } from 'date-fns';
import { RFI } from '@/hooks/useRFIs';
import { cn } from '@/lib/utils';

interface RFIPerformanceMetricsProps {
  rfis: RFI[];
  projectUsers: any[];
  timeRange: '7d' | '30d' | '90d' | '1y';
  className?: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];

export const RFIPerformanceMetrics: React.FC<RFIPerformanceMetricsProps> = ({
  rfis,
  projectUsers,
  timeRange,
  className
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'volume' | 'efficiency' | 'quality'>('volume');

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
      default:
        return rfis;
    }

    return rfis.filter(rfi => new Date(rfi.created_at) >= startDate);
  }, [rfis, timeRange]);

  // Performance benchmarks and targets
  const benchmarks = {
    responseTime: {
      excellent: 2, // days
      good: 5,
      target: 3
    },
    responseRate: {
      excellent: 90, // percentage
      good: 75,
      target: 85
    },
    firstTimeResolution: {
      excellent: 80, // percentage
      good: 65,
      target: 75
    }
  };

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    const answered = filteredRFIs.filter(rfi => rfi.status === 'answered');
    const overdue = filteredRFIs.filter(rfi => rfi.status === 'overdue');
    const outstanding = filteredRFIs.filter(rfi => rfi.status === 'outstanding');

    // Response time analysis
    const responseTimes = answered
      .filter(rfi => rfi.response_date && rfi.created_at)
      .map(rfi => {
        const created = new Date(rfi.created_at);
        const responded = new Date(rfi.response_date!);
        return Math.round((responded.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      });

    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
      : 0;

    const medianResponseTime = responseTimes.length > 0
      ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)]
      : 0;

    // Response rate
    const responseRate = filteredRFIs.length > 0 
      ? (answered.length / filteredRFIs.length) * 100 
      : 0;

    // First-time resolution rate (assuming single response means resolved)
    const firstTimeResolved = answered.filter(rfi => !rfi.question.includes('follow-up')).length;
    const firstTimeResolutionRate = answered.length > 0 
      ? (firstTimeResolved / answered.length) * 100 
      : 0;

    // Efficiency metrics
    const avgTimeToFirstResponse = responseTimes.length > 0 ? avgResponseTime : 0;
    const onTimeCompletionRate = filteredRFIs.length > 0 
      ? ((filteredRFIs.length - overdue.length) / filteredRFIs.length) * 100 
      : 0;

    // Quality metrics
    const criticalRFIs = filteredRFIs.filter(rfi => rfi.priority === 'critical');
    const criticalOnTime = criticalRFIs.filter(rfi => rfi.status !== 'overdue').length;
    const criticalResponseRate = criticalRFIs.length > 0 
      ? (criticalOnTime / criticalRFIs.length) * 100 
      : 100;

    return {
      volume: {
        total: filteredRFIs.length,
        answered: answered.length,
        outstanding: outstanding.length,
        overdue: overdue.length
      },
      efficiency: {
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        medianResponseTime,
        responseRate: Math.round(responseRate * 10) / 10,
        onTimeCompletionRate: Math.round(onTimeCompletionRate * 10) / 10,
        avgTimeToFirstResponse: Math.round(avgTimeToFirstResponse * 10) / 10
      },
      quality: {
        firstTimeResolutionRate: Math.round(firstTimeResolutionRate * 10) / 10,
        criticalResponseRate: Math.round(criticalResponseRate * 10) / 10,
        escalationRate: filteredRFIs.length > 0 
          ? (filteredRFIs.filter(rfi => rfi.priority === 'critical').length / filteredRFIs.length) * 100 
          : 0
      }
    };
  }, [filteredRFIs]);

  // Trend analysis - compare with previous period
  const trendAnalysis = useMemo(() => {
    const now = new Date();
    let currentPeriodStart: Date;
    let previousPeriodStart: Date;
    let previousPeriodEnd: Date;

    switch (timeRange) {
      case '7d':
        currentPeriodStart = subDays(now, 7);
        previousPeriodStart = subDays(now, 14);
        previousPeriodEnd = subDays(now, 7);
        break;
      case '30d':
        currentPeriodStart = subDays(now, 30);
        previousPeriodStart = subDays(now, 60);
        previousPeriodEnd = subDays(now, 30);
        break;
      case '90d':
        currentPeriodStart = subDays(now, 90);
        previousPeriodStart = subDays(now, 180);
        previousPeriodEnd = subDays(now, 90);
        break;
      case '1y':
        currentPeriodStart = subDays(now, 365);
        previousPeriodStart = subDays(now, 730);
        previousPeriodEnd = subDays(now, 365);
        break;
      default:
        return {};
    }

    const currentPeriodRFIs = rfis.filter(rfi => 
      new Date(rfi.created_at) >= currentPeriodStart && new Date(rfi.created_at) <= now
    );

    const previousPeriodRFIs = rfis.filter(rfi => 
      new Date(rfi.created_at) >= previousPeriodStart && new Date(rfi.created_at) <= previousPeriodEnd
    );

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      volumeChange: calculateChange(currentPeriodRFIs.length, previousPeriodRFIs.length),
      responseRateChange: calculateChange(
        (currentPeriodRFIs.filter(rfi => rfi.status === 'answered').length / currentPeriodRFIs.length) * 100,
        (previousPeriodRFIs.filter(rfi => rfi.status === 'answered').length / previousPeriodRFIs.length) * 100
      )
    };
  }, [rfis, timeRange]);

  // Team performance comparison
  const teamComparison = useMemo(() => {
    return projectUsers.map(user => {
      const userRFIs = filteredRFIs.filter(rfi => rfi.assigned_to === user.user_id);
      const answeredRFIs = userRFIs.filter(rfi => rfi.status === 'answered');
      
      const responseTimes = answeredRFIs
        .filter(rfi => rfi.response_date && rfi.created_at)
        .map(rfi => {
          const created = new Date(rfi.created_at);
          const responded = new Date(rfi.response_date!);
          return Math.round((responded.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        });

      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      return {
        name: user.user_profile?.name || 'Unknown',
        role: user.user_profile?.role || user.role,
        assigned: userRFIs.length,
        answered: answeredRFIs.length,
        responseRate: userRFIs.length > 0 ? (answeredRFIs.length / userRFIs.length) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime * 10) / 10
      };
    }).filter(user => user.assigned > 0);
  }, [filteredRFIs, projectUsers]);

  // Performance score calculation
  const performanceScore = useMemo(() => {
    const { efficiency, quality } = performanceMetrics;
    
    // Weighted scoring system
    const responseTimeScore = Math.max(0, 100 - (efficiency.avgResponseTime / benchmarks.responseTime.target) * 100);
    const responseRateScore = (efficiency.responseRate / benchmarks.responseRate.target) * 100;
    const resolutionScore = (quality.firstTimeResolutionRate / benchmarks.firstTimeResolution.target) * 100;
    
    const overallScore = (responseTimeScore * 0.4 + responseRateScore * 0.4 + resolutionScore * 0.2);
    
    return {
      overall: Math.min(100, Math.round(overallScore)),
      breakdown: {
        responseTime: Math.round(responseTimeScore),
        responseRate: Math.round(responseRateScore),
        resolution: Math.round(resolutionScore)
      }
    };
  }, [performanceMetrics, benchmarks]);

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', color: 'text-green-600' };
    if (score >= 80) return { grade: 'B', color: 'text-blue-600' };
    if (score >= 70) return { grade: 'C', color: 'text-yellow-600' };
    if (score >= 60) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  const MetricCard = ({ 
    title, 
    value, 
    target, 
    benchmark, 
    trend, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string;
    value: number;
    target?: number;
    benchmark?: { excellent: number; good: number };
    trend?: number;
    icon: any;
    format?: 'number' | 'percentage' | 'days';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'percentage':
          return `${val}%`;
        case 'days':
          return `${val} ${val === 1 ? 'day' : 'days'}`;
        default:
          return val.toString();
      }
    };

    const getStatus = () => {
      if (!benchmark) return 'neutral';
      if (format === 'days') {
        // For days, lower is better
        if (value <= benchmark.excellent) return 'excellent';
        if (value <= benchmark.good) return 'good';
        return 'poor';
      } else {
        // For percentages and numbers, higher is better
        if (value >= benchmark.excellent) return 'excellent';
        if (value >= benchmark.good) return 'good';
        return 'poor';
      }
    };

    const status = getStatus();
    const statusColors = {
      excellent: 'text-green-600 bg-green-50 border-green-200',
      good: 'text-blue-600 bg-blue-50 border-blue-200',
      poor: 'text-red-600 bg-red-50 border-red-200',
      neutral: 'text-gray-600 bg-gray-50 border-gray-200'
    };

    return (
      <Card className={cn('transition-all', statusColors[status])}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold">{formatValue(value)}</p>
              {target && (
                <p className="text-xs text-muted-foreground">
                  Target: {formatValue(target)}
                </p>
              )}
            </div>
            <div className="text-right space-y-1">
              <Icon className="h-5 w-5 ml-auto" />
              {trend !== undefined && (
                <div className={cn(
                  "flex items-center text-xs",
                  trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-600"
                )}>
                  {trend > 0 ? <ArrowUp className="h-3 w-3" /> : trend < 0 ? <ArrowDown className="h-3 w-3" /> : null}
                  <span>{Math.abs(trend).toFixed(1)}%</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Performance Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Performance Score</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className={cn(
                "text-6xl font-bold mb-2",
                getPerformanceGrade(performanceScore.overall).color
              )}>
                {getPerformanceGrade(performanceScore.overall).grade}
              </div>
              <p className="text-sm text-muted-foreground">Overall Grade</p>
              <p className="text-2xl font-semibold">{performanceScore.overall}/100</p>
            </div>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Response Time</span>
                  <span>{performanceScore.breakdown.responseTime}/100</span>
                </div>
                <Progress value={performanceScore.breakdown.responseTime} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Response Rate</span>
                  <span>{performanceScore.breakdown.responseRate}/100</span>
                </div>
                <Progress value={performanceScore.breakdown.responseRate} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Resolution Rate</span>
                  <span>{performanceScore.breakdown.resolution}/100</span>
                </div>
                <Progress value={performanceScore.breakdown.resolution} className="h-2" />
              </div>
            </div>

            <div className="col-span-2 space-y-2">
              <h4 className="font-medium">Performance Insights</h4>
              <div className="text-sm space-y-1">
                {performanceMetrics.efficiency.avgResponseTime <= benchmarks.responseTime.excellent && (
                  <p className="text-green-600">✓ Excellent response times</p>
                )}
                {performanceMetrics.efficiency.responseRate >= benchmarks.responseRate.excellent && (
                  <p className="text-green-600">✓ High response rate</p>
                )}
                {performanceMetrics.quality.firstTimeResolutionRate >= benchmarks.firstTimeResolution.excellent && (
                  <p className="text-green-600">✓ Strong first-time resolution</p>
                )}
                {performanceMetrics.efficiency.avgResponseTime > benchmarks.responseTime.good && (
                  <p className="text-yellow-600">⚠ Response times need improvement</p>
                )}
                {performanceMetrics.efficiency.responseRate < benchmarks.responseRate.good && (
                  <p className="text-red-600">⚠ Low response rate</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Avg Response Time"
          value={performanceMetrics.efficiency.avgResponseTime}
          target={benchmarks.responseTime.target}
          benchmark={benchmarks.responseTime}
          trend={trendAnalysis.responseRateChange}
          icon={Clock}
          format="days"
        />
        <MetricCard
          title="Response Rate"
          value={performanceMetrics.efficiency.responseRate}
          target={benchmarks.responseRate.target}
          benchmark={benchmarks.responseRate}
          trend={trendAnalysis.responseRateChange}
          icon={Target}
          format="percentage"
        />
        <MetricCard
          title="On-Time Completion"
          value={performanceMetrics.efficiency.onTimeCompletionRate}
          target={85}
          benchmark={{ excellent: 90, good: 75 }}
          icon={Calendar}
          format="percentage"
        />
        <MetricCard
          title="First-Time Resolution"
          value={performanceMetrics.quality.firstTimeResolutionRate}
          target={benchmarks.firstTimeResolution.target}
          benchmark={benchmarks.firstTimeResolution}
          icon={Zap}
          format="percentage"
        />
      </div>

      {/* Team Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Team Performance Comparison</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamComparison.map((member, index) => (
              <div key={member.name} className="grid grid-cols-6 gap-4 p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{member.assigned}</p>
                  <p className="text-xs text-muted-foreground">Assigned</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{member.answered}</p>
                  <p className="text-xs text-muted-foreground">Answered</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{Math.round(member.responseRate)}%</p>
                  <p className="text-xs text-muted-foreground">Response Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{member.avgResponseTime}</p>
                  <p className="text-xs text-muted-foreground">Avg Days</p>
                </div>
                <div className="text-center">
                  <Badge variant={
                    member.responseRate >= 85 ? "default" : 
                    member.responseRate >= 70 ? "secondary" : "destructive"
                  }>
                    {member.responseRate >= 85 ? "Excellent" : 
                     member.responseRate >= 70 ? "Good" : "Needs Improvement"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
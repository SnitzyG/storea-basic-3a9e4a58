import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  Database, 
  Wifi, 
  Server, 
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  lastChecked: Date;
}

interface SystemStatus {
  database: 'online' | 'offline' | 'slow';
  realtime: 'connected' | 'disconnected' | 'reconnecting';
  auth: 'operational' | 'degraded' | 'down';
  storage: 'available' | 'limited' | 'unavailable';
}

export const SystemHealthMonitor = () => {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'offline',
    realtime: 'disconnected',
    auth: 'down',
    storage: 'unavailable'
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const checkSystemHealth = async () => {
    setLoading(true);
    const newMetrics: HealthMetric[] = [];
    const newStatus: SystemStatus = {
      database: 'offline',
      realtime: 'disconnected',
      auth: 'down',
      storage: 'unavailable'
    };

    try {
      // Test Database Performance
      const dbStart = performance.now();
      const { data: dbTest, error: dbError } = await supabase
        .from('projects')
        .select('count')
        .limit(1);
      const dbTime = performance.now() - dbStart;

      if (!dbError) {
        newStatus.database = dbTime < 500 ? 'online' : 'slow';
        newMetrics.push({
          name: 'Database Response',
          value: dbTime,
          unit: 'ms',
          status: dbTime < 300 ? 'healthy' : dbTime < 500 ? 'warning' : 'critical',
          trend: 'stable',
          lastChecked: new Date()
        });
      }

      // Test Auth System
      try {
        const { data: authTest } = await supabase.auth.getSession();
        newStatus.auth = 'operational';
        newMetrics.push({
          name: 'Auth System',
          value: 100,
          unit: '%',
          status: 'healthy',
          trend: 'stable',
          lastChecked: new Date()
        });
      } catch {
        newStatus.auth = 'degraded';
      }

      // Test Real-time Connection
      const rtStart = performance.now();
      const channel = supabase.channel('health-test');
      const rtConnected = await new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => resolve(false), 3000);
        channel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout);
            resolve(true);
          }
        });
      });
      const rtTime = performance.now() - rtStart;

      if (rtConnected) {
        newStatus.realtime = 'connected';
        newMetrics.push({
          name: 'Real-time Connection',
          value: rtTime,
          unit: 'ms',
          status: rtTime < 1000 ? 'healthy' : 'warning',
          trend: 'stable',
          lastChecked: new Date()
        });
      } else {
        newStatus.realtime = 'disconnected';
      }

      supabase.removeChannel(channel);

      // Test Storage (if available)
      try {
        const { data: storageTest } = await supabase.storage.listBuckets();
        if (storageTest) {
          newStatus.storage = 'available';
          newMetrics.push({
            name: 'Storage System',
            value: 100,
            unit: '%',
            status: 'healthy',
            trend: 'stable',
            lastChecked: new Date()
          });
        }
      } catch {
        newStatus.storage = 'limited';
      }

      // Memory Usage (approximate based on performance)
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        const memoryUsage = (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100;
        newMetrics.push({
          name: 'Memory Usage',
          value: memoryUsage,
          unit: '%',
          status: memoryUsage < 70 ? 'healthy' : memoryUsage < 85 ? 'warning' : 'critical',
          trend: 'stable',
          lastChecked: new Date()
        });
      }

      // Network Latency (rough estimate)
      const networkStart = performance.now();
      await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' });
      const networkTime = performance.now() - networkStart;
      
      newMetrics.push({
        name: 'Network Latency',
        value: networkTime,
        unit: 'ms',
        status: networkTime < 100 ? 'healthy' : networkTime < 300 ? 'warning' : 'critical',
        trend: 'stable',
        lastChecked: new Date()
      });

    } catch (error) {
      console.error('Health check failed:', error);
    }

    setMetrics(newMetrics);
    setSystemStatus(newStatus);
    setLastUpdate(new Date());
    setLoading(false);
  };

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'operational':
      case 'connected':
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'warning':
      case 'slow':
      case 'degraded':
      case 'reconnecting':
      case 'limited':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
      case 'offline':
      case 'down':
      case 'disconnected':
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
      case 'operational':
      case 'connected':
      case 'available':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
      case 'slow':
      case 'degraded':
      case 'reconnecting':
      case 'limited':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Activity className="h-3 w-3 text-gray-600" />;
    }
  };

  const overallHealth = metrics.length > 0 
    ? Math.round((metrics.filter(m => m.status === 'healthy').length / metrics.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health Monitor
              </CardTitle>
              <CardDescription>
                Real-time monitoring of system components and performance
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{overallHealth}%</div>
              <div className="text-sm text-muted-foreground">System Health</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={checkSystemHealth}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </Button>
            <div className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          </div>

          <Progress value={overallHealth} className="w-full" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Components
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <span>Database</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.database)}
                <Badge className={getStatusColor(systemStatus.database)}>
                  {systemStatus.database}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <span>Real-time</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.realtime)}
                <Badge className={getStatusColor(systemStatus.realtime)}>
                  {systemStatus.realtime}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Authentication</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.auth)}
                <Badge className={getStatusColor(systemStatus.auth)}>
                  {systemStatus.auth}
                </Badge>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span>Storage</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(systemStatus.storage)}
                <Badge className={getStatusColor(systemStatus.storage)}>
                  {systemStatus.storage}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getTrendIcon(metric.trend)}
                  <span className="text-sm">{metric.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {metric.value.toFixed(0)}{metric.unit}
                  </span>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {metrics.some(m => m.status !== 'healthy') && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Performance Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics
                .filter(m => m.status !== 'healthy')
                .map((metric, index) => (
                  <div key={index} className="text-sm text-yellow-700">
                    • {metric.name}: {metric.value.toFixed(0)}{metric.unit} - 
                    {metric.status === 'warning' ? ' Consider optimization' : ' Requires immediate attention'}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
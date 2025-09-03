import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Clock, Database, Wifi, AlertTriangle, CheckCircle } from 'lucide-react';

interface PerformanceMetrics {
  loadTime: number;
  apiResponseTimes: { endpoint: string; time: number }[];
  memoryUsage: number;
  networkStatus: 'online' | 'offline';
  errorCount: number;
  bundleSize: number;
}

interface APICallLog {
  endpoint: string;
  method: string;
  responseTime: number;
  status: number;
  timestamp: number;
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    apiResponseTimes: [],
    memoryUsage: 0,
    networkStatus: 'online',
    errorCount: 0,
    bundleSize: 0
  });
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [apiCalls, setApiCalls] = useState<APICallLog[]>([]);

  // Monitor network status
  useEffect(() => {
    const updateNetworkStatus = () => {
      setMetrics(prev => ({
        ...prev,
        networkStatus: navigator.onLine ? 'online' : 'offline'
      }));
    };

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
    };
  }, []);

  // Monitor API calls by intercepting fetch
  useEffect(() => {
    if (!isMonitoring) return;

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const [resource, config] = args;
      const url = typeof resource === 'string' ? resource : (resource instanceof URL ? resource.toString() : resource.url);
      const method = config?.method || 'GET';

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        // Log API call
        const callLog: APICallLog = {
          endpoint: typeof resource === 'string' ? resource : (resource instanceof URL ? resource.toString() : resource.url),
          method,
          responseTime,
          status: response.status,
          timestamp: Date.now()
        };

        setApiCalls(prev => [...prev.slice(-9), callLog]); // Keep last 10 calls

        // Update metrics
        setMetrics(prev => ({
          ...prev,
          apiResponseTimes: [...prev.apiResponseTimes.slice(-9), {
            endpoint: url.split('/').pop() || 'unknown',
            time: responseTime
          }]
        }));

        return response;
      } catch (error) {
        setMetrics(prev => ({
          ...prev,
          errorCount: prev.errorCount + 1
        }));
        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isMonitoring]);

  // Monitor memory usage
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / (1024 * 1024);
        setMetrics(prev => ({
          ...prev,
          memoryUsage: usedMB
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  // Calculate page load time
  useEffect(() => {
    const loadTime = performance.timing
      ? performance.timing.loadEventEnd - performance.timing.navigationStart
      : performance.now();
    
    setMetrics(prev => ({
      ...prev,
      loadTime
    }));
  }, []);

  const startMonitoring = () => {
    setIsMonitoring(true);
    setApiCalls([]);
    setMetrics(prev => ({
      ...prev,
      errorCount: 0,
      apiResponseTimes: []
    }));
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const getPerformanceScore = () => {
    const loadScore = metrics.loadTime < 2000 ? 100 : Math.max(0, 100 - (metrics.loadTime - 2000) / 50);
    const apiScore = metrics.apiResponseTimes.length > 0 
      ? Math.max(0, 100 - (metrics.apiResponseTimes.reduce((sum, api) => sum + api.time, 0) / metrics.apiResponseTimes.length) / 5)
      : 100;
    const memoryScore = metrics.memoryUsage < 50 ? 100 : Math.max(0, 100 - (metrics.memoryUsage - 50) * 2);
    
    return Math.round((loadScore + apiScore + memoryScore) / 3);
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (time: number, threshold: number) => {
    if (time < threshold) return 'text-green-600';
    if (time < threshold * 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  const performanceScore = getPerformanceScore();

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Performance Monitor
        </CardTitle>
        <CardDescription>
          Monitor application performance, API response times, and resource usage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${metrics.networkStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground capitalize">
              {metrics.networkStatus}
            </span>
          </div>
        </div>

        {/* Performance Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Overall Performance Score</span>
            <Badge variant={performanceScore >= 80 ? "default" : performanceScore >= 60 ? "secondary" : "destructive"}>
              {performanceScore}/100
            </Badge>
          </div>
          <Progress value={performanceScore} className="h-2" />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Page Load</span>
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(metrics.loadTime, 2000)}`}>
                {formatTime(metrics.loadTime)}
              </div>
              <div className="text-xs text-muted-foreground">
                Target: &lt;2s
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Avg API Time</span>
              </div>
              <div className={`text-2xl font-bold ${
                metrics.apiResponseTimes.length > 0 
                  ? getStatusColor(metrics.apiResponseTimes.reduce((sum, api) => sum + api.time, 0) / metrics.apiResponseTimes.length, 500)
                  : 'text-muted-foreground'
              }`}>
                {metrics.apiResponseTimes.length > 0 
                  ? formatTime(metrics.apiResponseTimes.reduce((sum, api) => sum + api.time, 0) / metrics.apiResponseTimes.length)
                  : 'N/A'
                }
              </div>
              <div className="text-xs text-muted-foreground">
                Target: &lt;500ms
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Memory Usage</span>
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(metrics.memoryUsage, 50)}`}>
                {metrics.memoryUsage.toFixed(1)}MB
              </div>
              <div className="text-xs text-muted-foreground">
                Target: &lt;50MB
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Errors</span>
              </div>
              <div className={`text-2xl font-bold ${metrics.errorCount === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metrics.errorCount}
              </div>
              <div className="text-xs text-muted-foreground">
                Target: 0
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent API Calls */}
        {apiCalls.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Recent API Calls</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {apiCalls.slice().reverse().map((call, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {call.method}
                    </Badge>
                    <span className="font-mono text-xs truncate max-w-xs">
                      {call.endpoint.split('/').pop()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={getStatusColor(call.responseTime, 500)}>
                      {formatTime(call.responseTime)}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${
                      call.status >= 200 && call.status < 300 ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
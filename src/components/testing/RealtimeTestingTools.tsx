import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useRealtime } from '@/context/RealtimeContext';
import { useAdvancedProjects } from '@/hooks/useAdvancedProjects';
import { useDocuments } from '@/hooks/useDocuments';
import { useRFIs } from '@/hooks/useRFIs';
import { useMessages } from '@/hooks/useMessages';
import { useNotifications } from '@/hooks/useNotifications';
import { useActivity } from '@/hooks/useActivity';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wifi, 
  RefreshCw, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  Database,
  MessageSquare,
  FileText,
  HelpCircle,
  Bell,
  Activity,
  Settings
} from 'lucide-react';

export const RealtimeTestingTools: React.FC = () => {
  const [testResults, setTestResults] = useState<Record<string, 'pending' | 'pass' | 'fail'>>({});
  const [isRunningTests, setIsRunningTests] = useState(false);
  const { toast } = useToast();
  const { isConnected, connectionStatus, lastUpdate } = useRealtime();
  
  // Use various hooks to test real-time updates
  const { projects, fetchProjects } = useAdvancedProjects();
  const { documents } = useDocuments();
  const { rfis } = useRFIs();
  const { notifications } = useNotifications();
  const { activities } = useActivity();

  const testComponents = [
    { name: 'Projects', icon: Database, hook: 'useAdvancedProjects', count: projects.length },
    { name: 'Documents', icon: FileText, hook: 'useDocuments', count: documents.length },
    { name: 'RFIs', icon: HelpCircle, hook: 'useRFIs', count: rfis.length },
    { name: 'Notifications', icon: Bell, hook: 'useNotifications', count: notifications.length },
    { name: 'Activities', icon: Activity, hook: 'useActivity', count: activities.length },
  ];

  const getStatusIcon = (status: 'pending' | 'pass' | 'fail') => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending': 
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getConnectionStatus = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: 'bg-green-100 text-green-800', text: 'Connected' };
      case 'connecting':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Connecting' };
      case 'error':
        return { color: 'bg-red-100 text-red-800', text: 'Error' };
      case 'disconnected':
      default:
        return { color: 'bg-gray-100 text-gray-800', text: 'Disconnected' };
    }
  };

  const runRealtimeTest = async () => {
    setIsRunningTests(true);
    setTestResults({});
    
    const tests = [
      {
        name: 'Connection Status',
        test: async () => {
          return isConnected;
        }
      },
      {
        name: 'Database Connectivity',
        test: async () => {
          const { data, error } = await supabase.from('profiles').select('id').limit(1);
          return !error && data !== null;
        }
      },
      {
        name: 'Real-time Channels',
        test: async () => {
          // Create a test channel and check if it connects
          const testChannel = supabase.channel('realtime-test');
          let connected = false;
          
          await new Promise((resolve) => {
            testChannel
              .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                  connected = true;
                }
                resolve(status);
              });
            
            // Timeout after 5 seconds
            setTimeout(() => resolve('timeout'), 5000);
          });
          
          supabase.removeChannel(testChannel);
          return connected;
        }
      },
      {
        name: 'Activity Logging',
        test: async () => {
          // Test if we can write to activity log
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return false;
          
          // Use secure RPC function instead of direct insert
          const { error } = await supabase.rpc('log_activity', {
            p_user_id: user.id,
            p_entity_type: 'test',
            p_entity_id: null,
            p_action: 'realtime_test',
            p_description: 'Testing real-time connectivity',
            p_metadata: { test: true, timestamp: Date.now() }
          });
          return !error;
        }
      }
    ];

    for (const test of tests) {
      setTestResults(prev => ({ ...prev, [test.name]: 'pending' }));
      
      try {
        const result = await test.test();
        setTestResults(prev => ({ 
          ...prev, 
          [test.name]: result ? 'pass' : 'fail' 
        }));
        
        if (!result) {
          console.error(`Test "${test.name}" failed`);
        }
      } catch (error) {
        console.error(`Test "${test.name}" error:`, error);
        setTestResults(prev => ({ ...prev, [test.name]: 'fail' }));
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsRunningTests(false);
    
    const allPassed = Object.values(testResults).every(result => result === 'pass');
    toast({
      title: allPassed ? "All Tests Passed" : "Some Tests Failed",
      description: allPassed 
        ? "Real-time functionality is working correctly" 
        : "Check the results below for details",
      variant: allPassed ? "default" : "destructive"
    });
  };

  const forceRefreshAll = async () => {
    toast({
      title: "Refreshing Data",
      description: "Manually refreshing all components..."
    });
    
    // Force refresh all data sources
    try {
      await Promise.all([
        fetchProjects && fetchProjects(),
      ]);
      
      toast({
        title: "Refresh Complete",
        description: "All data has been refreshed"
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh some data sources",
        variant: "destructive"
      });
    }
  };

  const { color, text } = getConnectionStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            Real-time Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Status:</span>
            <Badge className={color}>{text}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Connected:</span>
            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
              {isConnected ? 'Yes' : 'No'}
            </span>
          </div>
          
          {lastUpdate && (
            <div className="flex items-center justify-between">
              <span>Last Update:</span>
              <span className="text-sm text-muted-foreground">
                {lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Real-time Testing Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={runRealtimeTest}
              disabled={isRunningTests}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-2" />
              {isRunningTests ? 'Running Tests...' : 'Run Real-time Tests'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={forceRefreshAll}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Force Refresh All
            </Button>
          </div>

          {Object.keys(testResults).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Test Results:</h4>
              {Object.entries(testResults).map(([testName, status]) => (
                <div key={testName} className="flex items-center justify-between">
                  <span className="text-sm">{testName}</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="text-sm capitalize">{status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Component Data Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testComponents.map((component) => {
              const Icon = component.icon;
              return (
                <div key={component.name} className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="h-4 w-4" />
                    <span className="font-medium">{component.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Count: {component.count}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Hook: {component.hook}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
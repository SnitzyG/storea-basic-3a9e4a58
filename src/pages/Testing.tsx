import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RoleTestingTools } from '@/components/testing/RoleTestingTools';
import { PerformanceMonitor } from '@/components/testing/PerformanceMonitor';
import { SecurityTester } from '@/components/testing/SecurityTester';
import { TabFunctionalityTester } from '@/components/testing/TabFunctionalityTester';
import { useAuth } from '@/hooks/useAuth';
import { TestTube, Activity, Shield, CheckCircle, AlertTriangle, Bug } from 'lucide-react';

const Testing = () => {
  const { profile } = useAuth();

  const testingSuites = [
    {
      id: 'functionality',
      name: 'Tab Functionality',
      description: 'Test all application tabs for RLS and data access issues',
      icon: Bug,
      status: 'ready'
    },
    {
      id: 'roles',
      name: 'Role-Based Access',
      description: 'Test user permissions and data isolation',
      icon: TestTube,
      status: 'ready'
    },
    {
      id: 'performance',
      name: 'Performance Monitor',
      description: 'Monitor API response times and resource usage',
      icon: Activity,
      status: 'ready'
    },
    {
      id: 'security',
      name: 'Security Testing',
      description: 'Validate authentication and data protection',
      icon: Shield,
      status: 'ready'
    }
  ];

  const productionChecklist = [
    { item: 'All 4 user roles can complete their workflows', status: 'pending' },
    { item: 'No unauthorized data access between users/companies', status: 'pending' },
    { item: 'File uploads work with proper permissions', status: 'pending' },
    { item: 'Real-time messaging functions correctly', status: 'pending' },
    { item: 'Mobile responsive design works on all devices', status: 'pending' },
    { item: 'All API endpoints return proper responses', status: 'pending' },
    { item: 'Error states handled gracefully', status: 'pending' },
    { item: 'No console errors or warnings', status: 'pending' },
    { item: 'Performance meets targets (<2s load, <500ms API)', status: 'pending' },
    { item: 'All security measures in place', status: 'pending' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending':
      default:
        return <Bug className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Testing & Validation</h1>
        <p className="text-muted-foreground">
          Comprehensive testing suite for production readiness validation
        </p>
      </div>

      <Tabs defaultValue="functionality" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          {testingSuites.map((suite) => (
            <TabsTrigger key={suite.id} value={suite.id} className="flex items-center gap-2">
              <suite.icon className="h-4 w-4" />
              {suite.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="functionality" className="space-y-6">
          <TabFunctionalityTester />
        </TabsContent>

        <TabsContent value="roles" className="space-y-6">
          <RoleTestingTools />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceMonitor />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityTester />
        </TabsContent>
      </Tabs>

      {/* Production Readiness Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Production Readiness Checklist
          </CardTitle>
          <CardDescription>
            Final validation checklist before production deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {productionChecklist.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(check.status)}
                  <span className="text-sm">{check.item}</span>
                </div>
                {getStatusBadge(check.status)}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Testing Instructions:</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Run all test suites above to validate functionality</li>
              <li>Test each user role (architect, builder, contractor, homeowner)</li>
              <li>Verify data isolation between companies</li>
              <li>Test on mobile devices and different screen sizes</li>
              <li>Validate all workflows end-to-end</li>
              <li>Check console for any errors or warnings</li>
              <li>Monitor performance metrics during testing</li>
              <li>Validate security measures are working correctly</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Testing;
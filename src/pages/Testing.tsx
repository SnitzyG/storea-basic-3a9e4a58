import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RoleTestingTools } from '@/components/testing/RoleTestingTools';
import { PerformanceMonitor } from '@/components/testing/PerformanceMonitor';
import { RealtimeTestingTools } from '@/components/testing/RealtimeTestingTools';
import { SecurityTester } from '@/components/testing/SecurityTester';
import { TabFunctionalityTester } from '@/components/testing/TabFunctionalityTester';
import { InvitationSystemTester } from '@/components/testing/InvitationSystemTester';
import { ConfirmationWorkflowTester } from '@/components/testing/ConfirmationWorkflowTester';
import { ProductionReadinessTester } from '@/components/testing/ProductionReadinessTester';
import { SystemHealthMonitor } from '@/components/testing/SystemHealthMonitor';
import { FinalProductionValidator } from '@/components/testing/FinalProductionValidator';
import { EmailMonitoringDashboard } from '@/components/admin/EmailMonitoringDashboard';
import { CompanyDisplay } from '@/components/companies/CompanyDisplay';

import { useAuth } from '@/hooks/useAuth';
import { TestTube, Activity, Shield, CheckCircle, AlertTriangle, Bug, Monitor, Zap, Rocket, Building2 } from 'lucide-react';
  const Testing = () => {

  const { profile } = useAuth();

  const testingSuites = [
    {
      id: 'final',
      name: 'Final Validation',
      description: 'Complete production readiness validation',
      icon: Rocket,
      status: 'ready'
    },
    {
      id: 'production',
      name: 'Production Tests',
      description: 'Comprehensive production readiness validation',
      icon: CheckCircle,
      status: 'ready'
    },
    {
      id: 'health',
      name: 'System Health',
      description: 'Real-time system monitoring and performance',
      icon: Monitor,
      status: 'ready'
    },
    {
      id: 'functionality',
      name: 'Interface Tests',
      description: 'Test unified view/edit interface functionality',
      icon: Bug,
      status: 'ready'
    },
    {
      id: 'roles',
      name: 'Role Testing',
      description: 'Test user permissions and data isolation',
      icon: TestTube,
      status: 'ready'
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'Monitor API response times and resource usage',
      icon: Zap,
      status: 'ready'
    },
    {
      id: 'security',
      name: 'Security',
      description: 'Validate authentication and data protection',
      icon: Shield,
      status: 'ready'
    },
    {
      id: 'invitations',
      name: 'Invitations',
      description: 'Test team invitation emails and acceptance flow',
      icon: TestTube,
      status: 'ready'
    },
    {
      id: 'confirmation',
      name: 'Confirmation',
      description: 'Test confirmation workflow and email links',
      icon: Activity,
      status: 'ready'
    },
    {
      id: 'email',
      name: 'Email Monitor',
      description: 'Monitor email service health and delivery status',
      icon: Activity,
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
        return <CheckCircle className="h-4 w-4 text-construction-success" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-construction-warning" />;
      case 'pending':
      default:
        return <Bug className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-construction-success text-white">COMPLETED</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-construction-warning text-white">WARNING</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline">PENDING</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Testing & Validation</h1>
        <p className="text-muted-foreground">
          Comprehensive testing suite for production readiness validation
        </p>
      </div>

      <Tabs defaultValue="final" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 xl:grid-cols-10 gap-1">
          {testingSuites.slice(0, 5).map((suite) => (
            <TabsTrigger key={suite.id} value={suite.id} className="flex items-center gap-1 text-xs">
              <suite.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{suite.name}</span>
            </TabsTrigger>
          ))}
          {testingSuites.length > 5 && (
            <TabsList className="grid w-full grid-cols-5 gap-1 mt-2">
              {testingSuites.slice(5).map((suite) => (
                <TabsTrigger key={suite.id} value={suite.id} className="flex items-center gap-1 text-xs">
                  <suite.icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{suite.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          )}
        </TabsList>

        <TabsContent value="final" className="space-y-6">
          <FinalProductionValidator />
        </TabsContent>

        <TabsContent value="production" className="space-y-6">
          <ProductionReadinessTester />
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <CompanyDisplay />
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <SystemHealthMonitor />
        </TabsContent>

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

        <TabsContent value="invitations" className="space-y-6">
          <InvitationSystemTester />
        </TabsContent>

        <TabsContent value="confirmation" className="space-y-6">
          <ConfirmationWorkflowTester />
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <EmailMonitoringDashboard />
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
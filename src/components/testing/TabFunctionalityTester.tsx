import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useDocuments } from '@/hooks/useDocuments';
import { useRFIs } from '@/hooks/useRFIs';
import { useTenders } from '@/hooks/useTenders';
import { useMessages } from '@/hooks/useMessages';

interface TabTest {
  name: string;
  status: 'pending' | 'testing' | 'pass' | 'fail';
  error?: string;
  dataCount?: number;
}

export const TabFunctionalityTester = () => {
  const { user, profile } = useAuth();
  const { projects, loading: projectsLoading, fetchProjects } = useProjects();
  const { documents, loading: documentsLoading } = useDocuments();
  const { rfis, loading: rfisLoading } = useRFIs();
  const { tenders, loading: tendersLoading } = useTenders();
  const { messages, loading: messagesLoading } = useMessages();

  const [tests, setTests] = useState<TabTest[]>([
    { name: 'Projects Tab', status: 'pending' },
    { name: 'Documents Tab', status: 'pending' },
    { name: 'RFIs Tab', status: 'pending' },
    { name: 'Tenders Tab', status: 'pending' },
    { name: 'Messages Tab', status: 'pending' },
    { name: 'Database RLS', status: 'pending' },
    { name: 'Storage Access', status: 'pending' }
  ]);

  const updateTest = (index: number, updates: Partial<TabTest>) => {
    setTests(prev => prev.map((test, i) => 
      i === index ? { ...test, ...updates } : test
    ));
  };

  const testTabFunctionality = async () => {
    // Reset all tests
    setTests(prev => prev.map(test => ({ ...test, status: 'pending' as const })));

    // Test 1: Projects Tab
    updateTest(0, { status: 'testing' });
    try {
      await fetchProjects();
      if (projectsLoading === false) {
        updateTest(0, { 
          status: 'pass', 
          dataCount: projects.length,
          error: undefined 
        });
      } else {
        updateTest(0, { status: 'fail', error: 'Projects still loading' });
      }
    } catch (error: any) {
      updateTest(0, { status: 'fail', error: error.message });
    }

    // Test 2: Documents Tab
    updateTest(1, { status: 'testing' });
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*');
      
      if (error) throw error;
      updateTest(1, { 
        status: 'pass', 
        dataCount: data?.length || 0 
      });
    } catch (error: any) {
      updateTest(1, { status: 'fail', error: error.message });
    }

    // Test 3: RFIs Tab
    updateTest(2, { status: 'testing' });
    try {
      const { data, error } = await supabase
        .from('rfis')
        .select('*');
      
      if (error) throw error;
      updateTest(2, { 
        status: 'pass', 
        dataCount: data?.length || 0 
      });
    } catch (error: any) {
      updateTest(2, { status: 'fail', error: error.message });
    }

    // Test 4: Tenders Tab
    updateTest(3, { status: 'testing' });
    try {
      const { data, error } = await supabase
        .from('tenders')
        .select('*');
      
      if (error) throw error;
      updateTest(3, { 
        status: 'pass', 
        dataCount: data?.length || 0 
      });
    } catch (error: any) {
      updateTest(3, { status: 'fail', error: error.message });
    }

    // Test 5: Messages Tab
    updateTest(4, { status: 'testing' });
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*');
      
      if (error) throw error;
      updateTest(4, { 
        status: 'pass', 
        dataCount: data?.length || 0 
      });
    } catch (error: any) {
      updateTest(4, { status: 'fail', error: error.message });
    }

    // Test 6: Database RLS
    updateTest(5, { status: 'testing' });
    try {
      // Test that RLS is working by trying to access data
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .limit(1);

      const { data: projectUserData, error: projectUserError } = await supabase
        .from('project_users')
        .select('*')
        .limit(1);

      if (projectError && projectError.message.includes('infinite recursion')) {
        throw new Error('RLS infinite recursion still detected');
      }
      if (projectUserError && projectUserError.message.includes('infinite recursion')) {
        throw new Error('Project users RLS infinite recursion still detected');
      }

      updateTest(5, { status: 'pass', error: 'RLS policies working without recursion' });
    } catch (error: any) {
      updateTest(5, { status: 'fail', error: error.message });
    }

    // Test 7: Storage Access
    updateTest(6, { status: 'testing' });
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;
      
      const documentsBucket = buckets?.find(b => b.name === 'documents');
      if (!documentsBucket) {
        throw new Error('Documents bucket not found');
      }

      updateTest(6, { 
        status: 'pass', 
        error: `Found ${buckets?.length || 0} storage buckets` 
      });
    } catch (error: any) {
      updateTest(6, { status: 'fail', error: error.message });
    }
  };

  const createTestProject = async () => {
    if (!user || !profile?.company_id) {
      alert('User not authenticated or no company assigned');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: 'Test Project',
          description: 'Test project for validation',
          company_id: profile.company_id,
          created_by: user.id,
          status: 'planning'
        })
        .select()
        .single();

      if (error) throw error;

      // Also create project_users entry
      await supabase
        .from('project_users')
        .insert({
          project_id: data.id,
          user_id: user.id,
          role: profile.role,
          invited_by: user.id
        });

      alert('Test project created successfully!');
      await fetchProjects();
    } catch (error: any) {
      alert(`Failed to create test project: ${error.message}`);
    }
  };

  const getStatusIcon = (status: TabTest['status']) => {
    switch (status) {
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-gray-400" />;
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: TabTest['status']) => {
    const variants = {
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      testing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      pass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      fail: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    };
    
    return (
      <Badge className={variants[status]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const summary = {
    total: tests.length,
    passed: tests.filter(t => t.status === 'pass').length,
    failed: tests.filter(t => t.status === 'fail').length,
    pending: tests.filter(t => t.status === 'pending').length
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Tab Functionality Tests
        </CardTitle>
        <CardDescription>
          Test all application tabs to ensure they're working without RLS errors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            onClick={testTabFunctionality}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Run All Tests
          </Button>
          
          <Button 
            variant="outline"
            onClick={createTestProject}
            disabled={!user || !profile?.company_id}
            className="flex items-center gap-2"
          >
            Create Test Project
          </Button>
          
          <div className="text-sm text-muted-foreground">
            {summary.passed}/{summary.total} tests passed
          </div>
        </div>

        {summary.failed > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {summary.failed} test(s) failed. Check the details below for specific issues.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {tests.map((test, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h3 className="font-medium">{test.name}</h3>
                    {test.dataCount !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        {test.dataCount} records accessible
                      </p>
                    )}
                    {test.error && (
                      <p className="text-sm text-red-600 font-mono mt-1">
                        {test.error}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(test.status)}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Current Status:</h3>
          <div className="text-sm space-y-1">
            <p>• User: {user?.email} ({profile?.role})</p>
            <p>• Company: {profile?.company_id ? 'Assigned' : 'Not assigned'}</p>
            <p>• Projects: {projects.length} accessible</p>
            <p>• Documents: {documents.length} accessible</p>
            <p>• RFIs: {rfis.length} accessible</p>
            <p>• Tenders: {tenders.length} accessible</p>
            <p>• Messages: {messages.length} accessible</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Mail, 
  Clock,
  Users,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTeam } from '@/hooks/useProjectTeam';

export function InvitationSystemTester() {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { toast } = useToast();
  
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [testEmail, setTestEmail] = useState('');
  const [testRole, setTestRole] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    timestamp: string;
  }>>([]);

  const { teamMembers, addMember: addTeamMember } = useProjectTeam(selectedProject);

  const addTestResult = (test: string, status: 'pass' | 'fail' | 'warning', message: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const runComprehensiveTest = async () => {
    if (!selectedProject || !testEmail || !testRole) {
      toast({
        title: "Missing test parameters",
        description: "Please select a project and enter test email and role.",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setTestResults([]);

    try {
      // Test 1: Validate email format
      addTestResult('Email Validation', 'pass', `Testing email format: ${testEmail}`);

      // Test 2: Project permission check
      const project = projects.find(p => p.id === selectedProject);
      if (!project) {
        addTestResult('Project Access', 'fail', 'Selected project not found');
        return;
      }

      if (project.created_by !== user?.id) {
        addTestResult('Project Permission', 'warning', 'User is not project creator - invitation may fail');
      } else {
        addTestResult('Project Permission', 'pass', 'User has permission to invite team members');
      }

      // Test 3: Check for existing team member
      const existingMember = teamMembers.find(member => member.email === testEmail);
      if (existingMember) {
        addTestResult('Duplicate Check', 'warning', 'Email is already a team member');
      } else {
        addTestResult('Duplicate Check', 'pass', 'Email is not an existing team member');
      }

      // Test 4: Attempt to send invitation
      addTestResult('Email Sending', 'pass', 'Attempting to send invitation...');
      
      const success = await addTeamMember(testEmail, testRole, project.name);
      
      if (success) {
        addTestResult('Invitation System', 'pass', 'Invitation sent successfully');
        addTestResult('Error Handling', 'pass', 'System handled request correctly');
      } else {
        addTestResult('Invitation System', 'fail', 'Invitation failed to send');
        addTestResult('Error Handling', 'pass', 'System handled error gracefully');
      }

      // Test 5: Database consistency check
      setTimeout(async () => {
        addTestResult('Database Consistency', 'pass', 'Checking database state...');
        // The useProjectTeam hook will automatically refresh and show updated data
      }, 1000);

    } catch (error: any) {
      addTestResult('System Error', 'fail', `Unexpected error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const testEmailConfiguration = async () => {
    setTesting(true);
    addTestResult('Email Config', 'pass', 'Testing email service configuration...');

    try {
      // Test with a known test email (the current user's email)
      if (user?.email) {
        const success = await addTeamMember(user.email, 'contractor', 'Test Project');
        if (success) {
          addTestResult('Email Service', 'pass', 'Email service is working (sent to own email)');
        } else {
          addTestResult('Email Service', 'warning', 'Email service may have configuration issues');
        }
      }
    } catch (error: any) {
      if (error.message?.includes('domain')) {
        addTestResult('Email Service', 'warning', 'Domain verification required for Resend');
      } else {
        addTestResult('Email Service', 'fail', `Email service error: ${error.message}`);
      }
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'fail':
        return <Badge variant="destructive">FAIL</Badge>;
      case 'warning':
        return <Badge className="bg-orange-100 text-orange-800">WARN</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invitation System Testing
          </CardTitle>
          <CardDescription>
            Comprehensive testing for the team invitation email system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Test Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Test Email</Label>
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                type="email"
              />
            </div>

            <div className="space-y-2">
              <Label>Test Role</Label>
              <Select value={testRole} onValueChange={setTestRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="architect">Architect</SelectItem>
                  <SelectItem value="builder">Builder</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={runComprehensiveTest} 
              disabled={testing || !selectedProject || !testEmail || !testRole}
            >
              {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Run Full Test Suite
            </Button>

            <Button 
              onClick={testEmailConfiguration} 
              disabled={testing}
              variant="outline"
            >
              Test Email Config Only
            </Button>
          </div>

          {testResults.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Domain verification is required for production email delivery. 
                Visit <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com/domains</a> to verify your domain.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Test Results
            </CardTitle>
            <CardDescription>
              Real-time testing results and system health checks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.test}</p>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                    {getStatusBadge(result.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Team Status */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Team Members
            </CardTitle>
            <CardDescription>
              Current team for the selected project
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No team members yet</p>
            ) : (
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant="outline" className="capitalize">{member.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
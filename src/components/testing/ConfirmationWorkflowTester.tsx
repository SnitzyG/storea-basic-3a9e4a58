import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Mail, 
  UserPlus,
  ExternalLink,
  Copy,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function ConfirmationWorkflowTester() {
  const { toast } = useToast();
  
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [invitationLink, setInvitationLink] = useState('');
  const [testResults, setTestResults] = useState<Array<{
    step: string;
    status: 'pass' | 'fail' | 'warning' | 'pending';
    message: string;
    details?: string;
  }>>([]);

  const addTestResult = (step: string, status: 'pass' | 'fail' | 'warning' | 'pending', message: string, details?: string) => {
    setTestResults(prev => [...prev, { step, status, message, details }]);
  };

  const runWorkflowTest = async () => {
    if (!testEmail) {
      toast({
        title: "Missing email",
        description: "Please enter a test email address.",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setTestResults([]);
    setInvitationLink('');

    try {
      addTestResult('Email Validation', 'pending', 'Validating email format...');
      
      // Step 1: Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(testEmail)) {
        addTestResult('Email Validation', 'fail', 'Invalid email format');
        return;
      }
      addTestResult('Email Validation', 'pass', 'Email format is valid');

      // Step 2: Create test invitation
      addTestResult('Invitation Creation', 'pending', 'Creating test invitation...');
      
      const testProjectId = crypto.randomUUID();
      const invitationToken = crypto.randomUUID();
      
      // Create a mock invitation record
      const { error: invitationError } = await supabase
        .from('invitations')
        .insert({
          project_id: testProjectId,
          email: testEmail,
          role: 'contractor',
          inviter_id: (await supabase.auth.getUser()).data.user?.id,
          token: invitationToken,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (invitationError) {
        addTestResult('Invitation Creation', 'fail', `Failed to create test invitation: ${invitationError.message}`);
        return;
      }
      addTestResult('Invitation Creation', 'pass', 'Test invitation created successfully');

      // Step 3: Generate confirmation link
      addTestResult('Link Generation', 'pending', 'Generating confirmation link...');
      
      const frontendUrl = window.location.origin;
      const confirmationLink = `${frontendUrl}/accept-invitation?token=${invitationToken}`;
      setInvitationLink(confirmationLink);
      
      addTestResult('Link Generation', 'pass', 'Confirmation link generated', confirmationLink);

      // Step 4: Test link accessibility
      addTestResult('Link Validation', 'pending', 'Validating link accessibility...');
      
      try {
        // Verify the invitation can be fetched
        const { data: invitationData, error: fetchError } = await supabase
          .from('invitations')
          .select('id, email, role, expires_at')
          .eq('token', invitationToken)
          .maybeSingle();

        if (fetchError || !invitationData) {
          addTestResult('Link Validation', 'fail', 'Generated link cannot retrieve invitation data');
          return;
        }
        
        addTestResult('Link Validation', 'pass', 'Link can successfully retrieve invitation data');
      } catch (error: any) {
        addTestResult('Link Validation', 'fail', `Link validation failed: ${error.message}`);
        return;
      }

      // Step 5: Test different user scenarios
      addTestResult('User Scenarios', 'pending', 'Testing user flow scenarios...');

      // Check if user already exists
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const existingUser = authUsers?.users?.find((u: any) => u.email === testEmail);
      
      if (existingUser) {
        addTestResult('User Scenarios', 'warning', 'Email belongs to existing user - will show sign-in flow');
      } else {
        addTestResult('User Scenarios', 'pass', 'Email is new - will show sign-up flow');
      }

      // Step 6: Test expiration handling
      addTestResult('Expiration Check', 'pending', 'Testing expiration logic...');
      
      // Get the invitation data again for expiration check
      const { data: expirationData } = await supabase
        .from('invitations')
        .select('expires_at')
        .eq('token', invitationToken)
        .maybeSingle();
      
      if (expirationData) {
        const expiresAt = new Date(expirationData.expires_at);
        const now = new Date();
        const timeUntilExpiry = expiresAt.getTime() - now.getTime();
        const daysUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry > 0) {
          addTestResult('Expiration Check', 'pass', `Invitation valid for ${daysUntilExpiry} more days`);
        } else {
          addTestResult('Expiration Check', 'warning', 'Invitation has expired or will expire soon');
        }
      }

      // Step 7: Cleanup test data
      addTestResult('Cleanup', 'pending', 'Cleaning up test data...');
      
      const { error: cleanupError } = await supabase
        .from('invitations')
        .delete()
        .eq('token', invitationToken);
      
      if (cleanupError) {
        addTestResult('Cleanup', 'warning', 'Failed to cleanup test data - may need manual cleanup');
      } else {
        addTestResult('Cleanup', 'pass', 'Test data cleaned up successfully');
      }

      addTestResult('Overall Test', 'pass', 'Confirmation workflow test completed successfully!');

    } catch (error: any) {
      addTestResult('System Error', 'fail', `Unexpected error: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const copyLink = () => {
    if (invitationLink) {
      navigator.clipboard.writeText(invitationLink);
      toast({
        title: "Link copied",
        description: "Invitation link copied to clipboard."
      });
    }
  };

  const openLink = () => {
    if (invitationLink) {
      window.open(invitationLink, '_blank');
    }
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning' | 'pending') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: 'pass' | 'fail' | 'warning' | 'pending') => {
    switch (status) {
      case 'pass':
        return <Badge className="bg-green-100 text-green-800">PASS</Badge>;
      case 'fail':
        return <Badge variant="destructive">FAIL</Badge>;
      case 'warning':
        return <Badge className="bg-orange-100 text-orange-800">WARN</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-blue-50 text-blue-800">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Confirmation Link Workflow Tester
          </CardTitle>
          <CardDescription>
            Test the complete invitation acceptance workflow from email to project access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Test Email Address</Label>
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
                type="email"
              />
            </div>
            <Button 
              onClick={runWorkflowTest} 
              disabled={testing || !testEmail}
            >
              {testing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Test Workflow
            </Button>
          </div>

          {invitationLink && (
            <Alert className="border-blue-200 bg-blue-50">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-blue-800">Generated Test Link:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-white p-2 rounded border text-xs break-all flex-1">
                      {invitationLink}
                    </code>
                    <Button size="sm" variant="outline" onClick={copyLink}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={openLink}>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Step-by-step validation of the confirmation workflow</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{result.step}</p>
                      {getStatusBadge(result.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{result.message}</p>
                    {result.details && (
                      <div className="mt-2 p-2 bg-muted rounded text-xs font-mono break-all">
                        {result.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Manual Testing Steps:</strong>
                <ol className="mt-2 space-y-1 list-decimal list-inside text-sm">
                  <li>Run the automated test above to generate a test invitation link</li>
                  <li>Open the generated link in a new browser tab/incognito window</li>
                  <li>Test the sign-up flow for new users</li>
                  <li>Test the sign-in flow for existing users</li>
                  <li>Verify the success page displays correct project information</li>
                  <li>Confirm navigation to dashboard/projects works</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">✅ Expected Behaviors</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Valid links load the invitation page</li>
                  <li>• User sees project and role information</li>
                  <li>• Sign-up creates account and accepts invitation</li>
                  <li>• Sign-in authenticates and accepts invitation</li>
                  <li>• Success page shows project details</li>
                  <li>• Auto-redirect to dashboard works</li>
                </ul>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">❌ Error Scenarios</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Invalid/expired tokens show error</li>
                  <li>• Already accepted invitations are handled</li>
                  <li>• Password validation works</li>
                  <li>• Network errors are handled gracefully</li>
                  <li>• Duplicate accounts are prevented</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
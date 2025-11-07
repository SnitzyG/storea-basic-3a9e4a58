import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function JoinTender() {
  const { tenderId } = useParams<{ tenderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'checking' | 'success' | 'error' | 'unauthorized'>('checking');
  const [errorMessage, setErrorMessage] = useState('');
  const [tenderTitle, setTenderTitle] = useState('');

  useEffect(() => {
    const verifyAccess = async () => {
      if (!user) {
        setStatus('unauthorized');
        setLoading(false);
        return;
      }

      if (!tenderId) {
        setStatus('error');
        setErrorMessage('Invalid tender ID');
        setLoading(false);
        return;
      }

      try {
        // Check if tender exists
        const { data: tender, error: tenderError } = await supabase
          .from('tenders')
          .select('id, title')
          .eq('id', tenderId)
          .single();

        if (tenderError || !tender) {
          setStatus('error');
          setErrorMessage('Tender not found. Please check the Tender ID and try again.');
          setLoading(false);
          return;
        }

        setTenderTitle(tender.title);

        // Check if user has approved access
        const { data: accessData, error: accessError } = await supabase
          .from('tender_access')
          .select('status')
          .eq('tender_id', tenderId)
          .eq('user_id', user.id)
          .single();

        if (accessError || !accessData) {
          setStatus('error');
          setErrorMessage('You do not have access to this tender. Please request access first.');
          setLoading(false);
          return;
        }

        if (accessData.status !== 'approved') {
          setStatus('error');
          setErrorMessage(`Your access request is ${accessData.status}. Please wait for approval.`);
          setLoading(false);
          return;
        }

        // Access granted!
        setStatus('success');
        setLoading(false);
        
        // Redirect to tender view after 2 seconds
        setTimeout(() => {
          navigate(`/tender-view/${tenderId}`);
        }, 2000);
      } catch (error: any) {
        console.error('Error verifying tender access:', error);
        setStatus('error');
        setErrorMessage('An error occurred while verifying access. Please try again.');
        setLoading(false);
      }
    };

    verifyAccess();
  }, [tenderId, user, navigate]);

  if (status === 'unauthorized') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-6 w-6 text-destructive" />
              Authentication Required
            </CardTitle>
            <CardDescription>
              You must be logged in to access tenders
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => navigate('/auth')} className="w-full">
              Sign In
            </Button>
            <Button variant="outline" onClick={() => navigate('/tenders')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Verifying tender access...</p>
            <p className="text-sm text-muted-foreground text-center">
              Please wait while we check your permissions
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              Access Granted!
            </CardTitle>
            <CardDescription>
              {tenderTitle}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Redirecting you to the tender details...
            </p>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading tender package...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-6 w-6 text-destructive" />
            Access Denied
          </CardTitle>
          <CardDescription>
            Unable to access this tender
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {errorMessage}
          </p>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/tenders')} className="flex-1">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tenders
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()} className="flex-1">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

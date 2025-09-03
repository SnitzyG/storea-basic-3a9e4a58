import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorBoundaryFallbackProps {
  error?: Error;
  resetError: () => void;
}

export const ErrorBoundaryFallback = ({ error, resetError }: ErrorBoundaryFallbackProps) => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleReload = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const reportError = () => {
    // In production, this would send to error reporting service
    console.error('User reported error:', error);
    
    // You could integrate with services like Sentry, LogRocket, etc.
    // Example: Sentry.captureException(error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl text-destructive">
            Something went wrong
          </CardTitle>
          <CardDescription>
            We're sorry, but an unexpected error occurred. Please try one of the actions below.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {error && isDevelopment && (
            <Alert variant="destructive">
              <Bug className="h-4 w-4" />
              <AlertDescription>
                <details className="text-left">
                  <summary className="cursor-pointer font-medium mb-2">
                    Error Details (Development)
                  </summary>
                  <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-32 bg-muted p-2 rounded mt-2">
                    {error.message}
                    {error.stack && '\n\nStack trace:\n' + error.stack}
                  </pre>
                </details>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={resetError}
              className="w-full flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleReload}
              className="w-full flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleGoHome}
              className="w-full flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go to Home
            </Button>
          </div>
          
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Still having trouble?
            </p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={reportError}
              className="text-xs"
            >
              Report this error
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
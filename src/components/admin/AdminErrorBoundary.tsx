import { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class AdminErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin Error Boundary caught error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-background">
          <Card className="w-full max-w-2xl border-destructive/50 shadow-lg">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-destructive">
                    Something went wrong
                  </CardTitle>
                  <CardDescription>
                    An error occurred in the admin dashboard
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {this.state.error && (
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <p className="font-mono text-sm text-foreground font-medium">
                    {this.state.error.message}
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.error.stack && (
                    <pre className="mt-2 text-xs text-muted-foreground overflow-auto max-h-48 p-2 bg-background rounded">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={this.resetError} className="flex-1 gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                <Button 
                  onClick={() => window.location.href = '/admin/dashboard'} 
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Button>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                If this problem persists, please contact your system administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper to allow using hooks if needed in future
export function AdminErrorBoundary({ children, fallback }: Props) {
  return (
    <AdminErrorBoundaryClass fallback={fallback}>
      {children}
    </AdminErrorBoundaryClass>
  );
}

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // In a production app, you'd send this to an error reporting service
    // like Sentry, LogRocket, etc.
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-destructive mb-2">
                Something went wrong
              </h2>
              <p className="text-muted-foreground">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
            </div>
            
            {this.state.error && (
              <details className="mb-4 text-left">
                <summary className="cursor-pointer text-sm font-medium mb-2">
                  Error Details
                </summary>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {this.state.error.message}
                  {'\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            
            <div className="space-x-2">
              <button
                onClick={this.resetError}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
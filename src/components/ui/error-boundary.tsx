import React from 'react';
import { BUILD_VERSION, BUILD_TIMESTAMP } from './app-version';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
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

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log error details for debugging
    console.error('Error Details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      version: BUILD_VERSION,
      timestamp: BUILD_TIMESTAMP,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  copyErrorDetails = () => {
    const { error, errorInfo } = this.state;
    const details = `
STOREA Error Report
===================
Version: ${BUILD_VERSION}
Build: ${BUILD_TIMESTAMP}
URL: ${window.location.href}
Time: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}

Error: ${error?.message || 'Unknown error'}

Stack Trace:
${error?.stack || 'No stack trace'}

Component Stack:
${errorInfo?.componentStack || 'No component stack'}
    `.trim();

    navigator.clipboard.writeText(details);
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-lg w-full">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-destructive mb-2">
                Something went wrong
              </h2>
              <p className="text-muted-foreground">
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
            </div>
            
            {this.state.error && (
              <details className="mb-6 text-left bg-muted/50 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium mb-2 text-foreground">
                  Error Details (click to expand)
                </summary>
                <div className="space-y-2 mt-3">
                  <p className="text-xs text-muted-foreground">
                    <strong>Version:</strong> {BUILD_VERSION}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Error:</strong> {this.state.error.message}
                  </p>
                  <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-40 border border-border">
                    {this.state.error.stack}
                  </pre>
                  {this.state.errorInfo?.componentStack && (
                    <>
                      <p className="text-xs text-muted-foreground mt-2">
                        <strong>Component Stack:</strong>
                      </p>
                      <pre className="text-xs bg-background p-3 rounded overflow-auto max-h-32 border border-border">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
            
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={this.resetError}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm font-medium"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium"
              >
                Reload Page
              </button>
              <button
                onClick={this.copyErrorDetails}
                className="px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium"
              >
                Copy Error Details
              </button>
            </div>
            
            <p className="mt-6 text-xs text-muted-foreground">
              If this problem persists, please contact support with the error details.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

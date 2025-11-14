import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StorealiteLogo } from '@/components/ui/storealite-logo';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('404 - Page not found:', location.pathname);
    
    // Determine redirect target based on path
    const isAdminPath = location.pathname.startsWith('/admin');
    const redirectPath = isAdminPath ? '/admin/dashboard' : '/dashboard';
    
    // Automatically redirect after 3 seconds
    const redirectTimer = setTimeout(() => {
      navigate(redirectPath, { replace: true });
    }, 3000);

    return () => clearTimeout(redirectTimer);
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 animate-fade-in">
        {/* Logo with pulse animation */}
        <div className="flex justify-center">
          <div className="animate-pulse">
            <StorealiteLogo className="h-10" />
          </div>
        </div>
        
        {/* Error message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            {location.pathname.startsWith('/admin') 
              ? 'Admin page not found' 
              : 'Oh no! Something went wrong.'}
          </h1>
          <p className="text-muted-foreground">
            Redirecting to your dashboard...
          </p>
        </div>
        
        {/* Loading dots animation */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

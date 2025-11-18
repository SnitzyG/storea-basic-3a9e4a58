import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useAuth } from '@/hooks/useAuth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { isProfileComplete } from '@/utils/profileUtils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Home, FileText, DollarSign, Mail, LayoutDashboard, FolderOpen, MapIcon } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const [redirectCancelled, setRedirectCancelled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  usePageMeta({
    title: 'Page Not Found - 404 Error | STOREA',
    description: 'The page you are looking for could not be found. Use our search or quick links to find what you need.',
    canonicalPath: '/404',
    index: false
  });

  useEffect(() => {
    console.log('404 - Page not found:', location.pathname);
    
    if (loading || redirectCancelled) return;
    
    // Determine redirect target
    let redirectPath = '/';
    if (user && profile && !isProfileComplete(profile)) {
      redirectPath = '/profile-setup';
    } else if (user) {
      redirectPath = '/dashboard';
    } else if (location.pathname.startsWith('/admin')) {
      redirectPath = '/admin/dashboard';
    }
    
    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          navigate(redirectPath, { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [location.pathname, navigate, user, profile, loading, redirectCancelled]);

  const quickLinks = [
    { to: '/', label: 'Home', icon: Home, public: true },
    { to: '/features', label: 'Features', icon: FileText, public: true },
    { to: '/pricing', label: 'Pricing', icon: DollarSign, public: true },
    { to: '/contact', label: 'Contact', icon: Mail, public: true },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, public: false },
    { to: '/projects', label: 'Projects', icon: FolderOpen, public: false },
  ];

  const visibleLinks = user 
    ? quickLinks 
    : quickLinks.filter(link => link.public);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <StorealiteLogo className="h-12" />
          </div>
          
          <div>
            <CardTitle>
              <h1 className="text-4xl font-bold mb-2">Page Not Found - 404 Error</h1>
            </CardTitle>
            <CardDescription className="text-lg">
              {location.pathname.startsWith('/admin') 
                ? 'The admin page you are looking for does not exist.' 
                : 'The page you are looking for could not be found.'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Search functionality */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">Search for what you need:</h2>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setSearchOpen(true)}
            >
              Search projects, documents, and more...
            </Button>
          </div>

          {/* Quick navigation links */}
          <div className="space-y-2">
            <h2 className="text-sm font-medium">Quick links:</h2>
            <div className="grid grid-cols-2 gap-2">
              {visibleLinks.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to}>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Sitemap link */}
          <div className="pt-4 border-t">
            <a 
              href="/sitemap.xml" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-2"
            >
              <MapIcon className="h-4 w-4" />
              View sitemap
            </a>
          </div>

          {/* Redirect info */}
          {!redirectCancelled && countdown > 0 && (
            <div className="pt-4 border-t space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setRedirectCancelled(true)}
              >
                Cancel redirect
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default NotFound;

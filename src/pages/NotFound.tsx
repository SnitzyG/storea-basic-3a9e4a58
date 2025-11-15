import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('404 - Page not found:', location.pathname);
    
    // Wait for auth to load
    if (loading) return;
    
    // Determine redirect target based on auth state
    const redirectPath = location.pathname.startsWith('/admin') 
      ? '/admin/dashboard' 
      : '/dashboard';
    
    // Redirect immediately without showing error message
    navigate(redirectPath, { replace: true });
  }, [location.pathname, navigate, user, loading]);

  // Show nothing while redirecting
  return null;
};

export default NotFound;

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProfileSetup as ProfileSetupComponent } from '@/components/profile/ProfileSetup';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // If not authenticated, redirect to auth
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      // If profile is already complete (has name), redirect to projects
      if (profile && profile.name && profile.name.trim() !== '') {
        navigate('/projects', { replace: true });
        return;
      }
    }
  }, [user, profile, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  // Don't render if profile already complete (will redirect)
  if (profile && profile.name && profile.name.trim() !== '') {
    return null;
  }

  const handleComplete = () => {
    // Check for pending invitation tokens
    const pendingToken = sessionStorage.getItem('pendingInvitationToken');
    const pendingUrl = sessionStorage.getItem('pendingInvitationUrl');
    
    if (pendingToken && pendingUrl) {
      sessionStorage.removeItem('pendingInvitationToken');
      sessionStorage.removeItem('pendingInvitationUrl');
      navigate(pendingUrl, { replace: true });
    } else {
      navigate('/projects', { replace: true });
    }
  };

  return <ProfileSetupComponent onComplete={handleComplete} />;
};

export default ProfileSetup;

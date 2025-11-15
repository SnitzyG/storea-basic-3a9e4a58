import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ProfileSetup as ProfileSetupComponent } from '@/components/profile/ProfileSetup';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Check if profile is complete based on role
  const isProfileComplete = (prof: any) => {
    if (!prof || !prof.name || !prof.phone) return false;
    
    switch(prof.role) {
      case 'homeowner':
        return !!(prof.property_address && prof.project_type);
      case 'architect':
        return !!(prof.company_id && prof.professional_license_number && prof.years_experience !== null);
      case 'builder':
        return !!(prof.company_id && prof.business_registration_number && prof.company_address);
      case 'contractor':
        return !!(prof.professional_license_number && prof.years_experience !== null);
      default:
        return false;
    }
  };

  useEffect(() => {
    if (!loading) {
      // If not authenticated, redirect to auth
      if (!user) {
        navigate('/auth', { replace: true });
        return;
      }

      // If profile is already complete, redirect to dashboard
      if (profile && isProfileComplete(profile)) {
        navigate('/dashboard', { replace: true });
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
  if (profile && isProfileComplete(profile)) {
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
      // Redirect to dashboard as home page
      navigate('/dashboard', { replace: true });
    }
  };

  const handleSkip = () => {
    console.log('Skip button clicked - navigating to dashboard');
    // Allow users to skip and go to dashboard
    // They can complete their profile later from settings
    navigate('/dashboard', { replace: true });
  };

  console.log('ProfileSetup page rendering, onSkip handler:', handleSkip);

  return <ProfileSetupComponent onComplete={handleComplete} onSkip={handleSkip} />;
};

export default ProfileSetup;

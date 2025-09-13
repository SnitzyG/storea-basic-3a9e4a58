import { useAuth } from '@/hooks/useAuth';
import { useProjectLinking } from '@/hooks/useProjectLinking';
import { Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProfileSetup } from '@/components/profile/ProfileSetup';
interface AppLayoutProps {
  children: React.ReactNode;
}
export const AppLayout = ({
  children
}: AppLayoutProps) => {
  const {
    user,
    profile,
    loading
  } = useAuth();

  // Handle automatic project linking for homeowners and collaborators
  useProjectLinking();

  // Show loading state while authentication is being determined
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>;
  }

  // Only redirect if we're certain the user is not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if profile setup should be shown for new users or missing critical fields
  const shouldShowProfileSetup = () => {
    if (!profile) return true;
    
    // Check if user is new (created within last 7 days)
    const userCreatedAt = new Date(user.created_at || '');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isNewUser = userCreatedAt > sevenDaysAgo;
    
    // Check if critical fields are missing
    const hasCriticalFields = profile.name && profile.role;
    
    return isNewUser && !hasCriticalFields;
  };

  // If user exists but profile setup is needed, show profile setup
  if (shouldShowProfileSetup()) {
    return <ProfileSetup onComplete={() => window.location.reload()} />;
  }
  return <div className="min-h-screen bg-background flex">
      <Sidebar userRole={profile.role} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header user={user} profile={profile} />
        <main className="flex-1 overflow-hidden mx-0 py-[10px]">
          {children}
        </main>
      </div>
    </div>;
};
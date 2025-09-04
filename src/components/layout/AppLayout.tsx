import { useAuth } from '@/hooks/useAuth';
import { useProjectLinking } from '@/hooks/useProjectLinking';
import { Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProfileSetup } from '@/components/profile/ProfileSetup';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, profile, loading } = useAuth();
  
  // Handle automatic project linking for homeowners and collaborators
  useProjectLinking();

  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  // Only redirect if we're certain the user is not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user exists but no profile, show profile setup
  if (!profile) {
    return <ProfileSetup onComplete={() => window.location.reload()} />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar userRole={profile.role} />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header user={user} profile={profile} />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
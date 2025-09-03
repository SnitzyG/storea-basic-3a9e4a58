import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { user, profile, loading } = useAuth();

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

  // If user exists but no profile, wait for profile to load
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar userRole={profile.role} />
      <div className="flex-1 flex flex-col">
        <Header user={user} profile={profile} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
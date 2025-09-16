import { useAuth } from '@/hooks/useAuth';
import { useProjectLinking } from '@/hooks/useProjectLinking';
import { Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
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

  // Block access if email is not verified
  if (user && !user.email_confirmed_at) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Email Verification Required</h2>
            <p className="text-muted-foreground mb-6">
              Please check your email and click the verification link to activate your account.
            </p>
            <p className="text-sm text-muted-foreground">
              Can't find the email? Check your spam folder or contact support.
            </p>
          </div>
        </div>
      </div>
    );
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
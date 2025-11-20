import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectLinking } from '@/hooks/useProjectLinking';
import { Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ProjectSelectionProvider } from '@/context/ProjectSelectionContext';
import { supabase } from '@/integrations/supabase/client';
import { isProfileComplete } from '@/utils/profileUtils';
interface AppLayoutProps {
  children: React.ReactNode;
}
export const AppLayout = ({
  children
}: AppLayoutProps) => {
  const { user, profile, loading } = useAuth();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Handle automatic project linking for homeowners and collaborators
  useProjectLinking();

  // Determine admin role early to route admins to admin space and bypass approval gate
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
        if (mounted) setIsAdmin(Boolean(data));
      } catch (e) {
        console.error('Error checking admin role in AppLayout:', e);
        if (mounted) setIsAdmin(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

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

  // If admin, route to Admin space
  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>;
  }
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
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

  // Block access if user not approved
  if (profile && !profile.approved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold">Account Pending Approval</h2>
            <p className="text-muted-foreground">
              Your account is awaiting administrator approval. You'll receive an email once approved.
            </p>
            <button
              onClick={() => supabase.auth.signOut()}
              className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }


  const userRole = profile?.role ?? 'contractor';

  return (
    <ProjectSelectionProvider>
      <div className="min-h-screen bg-background flex">
        <Sidebar userRole={userRole} profile={profile} />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header user={user} profile={profile} />
          <main className="flex-1 overflow-hidden mx-0 py-[10px]">
            {children}
          </main>
        </div>
      </div>
    </ProjectSelectionProvider>
  );
};
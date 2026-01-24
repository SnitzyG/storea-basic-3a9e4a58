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

  // Bypass loading state for now
  /*
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>;
  }
  */

  // Bypassed auth check
  /*
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  */

  // Bypassed admin check
  /*
  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>;
  }
  if (isAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  */

  // Bypassed email verification
  /*
  if (user && !user.email_confirmed_at) {
    // ...
  }
  */

  // Bypassed profile approval
  /*
  if (profile && !profile.approved) {
    // ...
  }
  */

  // Mock user for UI if not logged in
  const displayUser = user || {
    id: 'mock-user-id',
    email: 'demo@storea.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString()
  } as any;

  const displayProfile = profile || {
    id: 'mock-user-id',
    name: 'Demo User',
    role: 'contractor', // Default role
    approved: true
  } as any;

  const userRole = displayProfile?.role ?? 'contractor';

  return (
    <ProjectSelectionProvider>
      <div className="min-h-screen bg-background flex">
        <Sidebar userRole={userRole} profile={displayProfile} />
        <div className="flex-1 flex flex-col min-h-screen">
          <Header user={displayUser} profile={displayProfile} />
          <main className="flex-1 overflow-hidden mx-0 py-[10px]">
            {children}
          </main>
        </div>
      </div>
    </ProjectSelectionProvider>
  );
};
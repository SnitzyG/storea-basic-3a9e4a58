import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import Dashboard from './Dashboard';
import Auth from './Auth';

const Index = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center animate-fade-in">Loading...</div>
      </div>
    );
  }

  // If not authenticated, show Auth page
  if (!user || !profile) {
    return (
      <div className="animate-fade-in">
        <Auth />
      </div>
    );
  }

  // If authenticated, show Dashboard
  return (
    <div className="animate-fade-in">
      <AppLayout>
        <Dashboard />
      </AppLayout>
    </div>
  );
};

export default Index;

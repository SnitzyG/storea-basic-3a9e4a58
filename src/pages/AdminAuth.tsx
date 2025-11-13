import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
import { Shield, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
export default function AdminAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    signIn
  } = useAuth();
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Sign in the user
      const {
        error: signInError
      } = await signIn(email, password);
      if (signInError) throw signInError;

      // Get the current user
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Authentication failed');
      }

      // Check if user has admin role
      const {
        data: hasAdminRole,
        error: roleError
      } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });
      if (roleError) throw roleError;
      if (!hasAdminRole) {
        // Sign out non-admin user
        await supabase.auth.signOut();
        toast({
          title: 'Access Denied',
          description: 'You do not have administrator privileges',
          variant: 'destructive'
        });
        return;
      }

      // Admins can access even if profile is not yet approved
      toast({
        title: 'Welcome Admin',
        description: 'Successfully logged in to admin dashboard'
      });
      navigate('/admin/dashboard');
      return;

      // Success - navigate to admin dashboard
      toast({
        title: 'Welcome Admin',
        description: 'Successfully logged in to admin dashboard'
      });
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Admin login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials or insufficient permissions',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-6 pt-10 pb-6">
          <div className="flex justify-center">
            <StorealiteLogo className="h-16" />
          </div>
          
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-4">
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <CardTitle className="text-2xl">
              Admin Portal
            </CardTitle>
            <CardDescription>
              Sign in with your administrator credentials
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="admin@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                This portal is restricted to authorized administrators only. 
                Unauthorized access attempts are logged.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in as Admin'}
            </Button>

            <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/')} disabled={loading}>
              Back to Home
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>;
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
import { Shield, AlertCircle, Users, BarChart3, Zap, Lock, FileText, Eye } from 'lucide-react';
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
  const features = [{
    icon: Users,
    title: 'User Management',
    description: 'Manage user accounts and permissions'
  }, {
    icon: BarChart3,
    title: 'System Analytics',
    description: 'Monitor platform performance in real-time'
  }, {
    icon: Shield,
    title: 'Security Controls',
    description: 'Advanced security and audit logs'
  }, {
    icon: Zap,
    title: 'Workflow Automation',
    description: 'Streamline administrative tasks'
  }];
  const securityIndicators = [{
    icon: Lock,
    text: 'Encrypted Connection'
  }, {
    icon: FileText,
    text: 'Audit Trail Active'
  }, {
    icon: Eye,
    text: '24/7 Monitoring'
  }];
  return <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Brand & Features */}
      <div className="lg:w-1/2 bg-gradient-to-br from-primary via-secondary to-accent p-8 lg:p-12 flex flex-col justify-between">
        <div>
          <div className="mb-12">
            <StorealiteLogo className="h-10" />
          </div>

          <div className="space-y-6 mb-12">
            <div className="space-y-4">
              
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-foreground">
                Admin Control Center
              </h1>
              <p className="text-lg text-foreground/80">
                Secure access to manage your platform
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
            {features.map((feature, index) => <div key={feature.title} className="animate-fade-in hover-scale p-4 rounded-xl bg-background/10 backdrop-blur-md border border-foreground/10" style={{
            animationDelay: `${index * 100}ms`
          }}>
                <feature.icon className="h-6 w-6 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                <p className="text-sm text-foreground/70">{feature.description}</p>
              </div>)}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 pt-8 border-t border-foreground/10">
          {securityIndicators.map(indicator => <div key={indicator.text} className="flex items-center gap-2">
              <indicator.icon className="h-4 w-4 text-foreground/70" />
              <span className="text-sm text-foreground/70">{indicator.text}</span>
            </div>)}
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="lg:w-1/2 flex items-center justify-center bg-background p-4 lg:p-8">
        <Card className="w-full max-w-md shadow-glow border-border">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <StorealiteLogo className="h-10" />
            </div>
            
            <div className="flex justify-center">
              <div className="rounded-full bg-gradient-to-br from-secondary/20 to-accent/20 p-4">
                <Shield className="h-10 w-10 text-primary" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <CardTitle className="text-2xl bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
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

              <Button type="submit" className="w-full bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign in as Admin'}
              </Button>

              <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/')} disabled={loading}>
                Back to Home
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>;
}
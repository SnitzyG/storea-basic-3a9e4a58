import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Building, Users, Home, Hammer } from 'lucide-react';

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  useEffect(() => {
    // Check if user came from email confirmation
    if (searchParams.get('confirmed') === 'true') {
      setEmailConfirmed(true);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await signIn(email, password);
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await signUp(email, password, name, role);
    setIsSubmitting(false);
  };

  const roleOptions = [
    { value: 'architect', label: 'Architect', icon: Building, description: 'Create and manage projects' },
    { value: 'builder', label: 'Builder', icon: Hammer, description: 'Execute construction work' },
    { value: 'homeowner', label: 'Homeowner', icon: Home, description: 'Project owner' },
    { value: 'contractor', label: 'Contractor', icon: Users, description: 'Specialist services' }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center gap-8">
        {/* Animated House Illustration */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="relative w-80 h-80">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Foundation */}
              <rect 
                x="40" y="160" width="120" height="30" 
                className="fill-muted animate-[fadeInUp_0.8s_ease-out_0.2s_both]"
              />
              
              {/* Walls */}
              <rect 
                x="50" y="120" width="100" height="40" 
                className="fill-primary/20 animate-[fadeInUp_0.8s_ease-out_0.6s_both]"
                stroke="hsl(var(--primary))" strokeWidth="2"
              />
              
              {/* Roof */}
              <polygon 
                points="45,120 100,80 155,120" 
                className="fill-primary animate-[fadeInUp_0.8s_ease-out_1s_both]"
              />
              
              {/* Windows */}
              <rect 
                x="65" y="135" width="15" height="15" 
                className="fill-secondary animate-[fadeIn_0.6s_ease-out_1.4s_both]"
                stroke="hsl(var(--primary))" strokeWidth="1"
              />
              <rect 
                x="120" y="135" width="15" height="15" 
                className="fill-secondary animate-[fadeIn_0.6s_ease-out_1.6s_both]"
                stroke="hsl(var(--primary))" strokeWidth="1"
              />
              
              {/* Window crosses */}
              <line x1="72.5" y1="135" x2="72.5" y2="150" className="stroke-primary animate-[fadeIn_0.4s_ease-out_1.8s_both]" strokeWidth="1"/>
              <line x1="65" y1="142.5" x2="80" y2="142.5" className="stroke-primary animate-[fadeIn_0.4s_ease-out_1.8s_both]" strokeWidth="1"/>
              <line x1="127.5" y1="135" x2="127.5" y2="150" className="stroke-primary animate-[fadeIn_0.4s_ease-out_2s_both]" strokeWidth="1"/>
              <line x1="120" y1="142.5" x2="135" y2="142.5" className="stroke-primary animate-[fadeIn_0.4s_ease-out_2s_both]" strokeWidth="1"/>
              
              {/* Door */}
              <rect 
                x="90" y="145" width="20" height="25" 
                className="fill-accent animate-[fadeIn_0.6s_ease-out_2.2s_both]"
                stroke="hsl(var(--primary))" strokeWidth="1"
              />
              
              {/* Door handle */}
              <circle 
                cx="106" cy="157" r="1.5" 
                className="fill-primary animate-[fadeIn_0.4s_ease-out_2.6s_both]"
              />
              
              {/* Chimney */}
              <rect 
                x="125" y="85" width="8" height="20" 
                className="fill-muted-foreground animate-[fadeInUp_0.6s_ease-out_2.8s_both]"
              />
              
              {/* Smoke */}
              <circle cx="129" cy="80" r="2" className="fill-muted-foreground/40 animate-[smokeFloat_2s_ease-in-out_3.2s_infinite]" />
              <circle cx="131" cy="75" r="1.5" className="fill-muted-foreground/30 animate-[smokeFloat_2s_ease-in-out_3.4s_infinite]" />
              <circle cx="127" cy="72" r="1" className="fill-muted-foreground/20 animate-[smokeFloat_2s_ease-in-out_3.6s_infinite]" />
            </svg>
          </div>
        </div>

        {/* Login Form Section */}
        <div className="w-full lg:w-1/2 max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary mb-2">STOREA Basic</h1>
            <p className="text-muted-foreground">Construction Management Platform</p>
            {emailConfirmed && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✓ Email confirmed! You can now sign in to your account.
                </p>
              </div>
            )}
          </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Your Role</Label>
                    <Select value={role} onValueChange={setRole} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-xs text-muted-foreground">{option.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting || !role}>
                    {isSubmitting ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
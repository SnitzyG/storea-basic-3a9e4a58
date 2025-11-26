import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id: string;
  role: 'architect' | 'builder' | 'homeowner' | 'contractor' | 'system_admin';
  name: string;
  company_id?: string;
  avatar_url?: string;
  phone?: string;
  company_name?: string;
  company_position?: string;
  company_address?: string;
  company_logo_url?: string;
  approved?: boolean;
  approved_at?: string;
  approved_by?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: string, company?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);

        // Handle Supabase password recovery deep-link
        if (event === 'PASSWORD_RECOVERY') {
          // Defer navigation to avoid blocking callback
          setTimeout(() => {
            window.location.href = '/auth?reset=true';
          }, 0);
        }
        
        if (session?.user && session.user.email_confirmed_at) {
          setTimeout(() => {
            if (mounted) fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        // Handle pending invitation token after authentication
        if (session?.user) {
          const pendingToken = sessionStorage.getItem('pending_invitation_token');
          if (pendingToken) {
            sessionStorage.removeItem('pending_invitation_token');
            setTimeout(() => {
              window.location.href = `/invite/${pendingToken}`;
            }, 100);
          }
        }
        
        // Only set loading to false once
        if (mounted) setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user && session.user.email_confirmed_at) {
        fetchUserProfile(session.user.id);
      }
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string, company?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth?confirmed=true`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            role,
            company
          }
        }
      });

      if (error) {
        toast({
          title: "Sign up failed",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      // Always require email verification
      if (data.user) {
        toast({
          title: "Verification email sent",
          description: "Please check your email and click the verification link to activate your account."
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        let description = error.message;
        if (error.message.includes('email_not_confirmed')) {
          description = "Please verify your email address before signing in. Check your inbox for the verification link.";
        } else if (error.message.includes('Invalid login credentials')) {
          description = "Invalid email or password. Please check your credentials and try again.";
        }
        
        toast({
          title: "Sign in failed",
          description,
          variant: "destructive"
        });
        return { error };
      }

      // Check if email is verified
      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        toast({
          title: "Email verification required",
          description: "Please verify your email address before signing in. Check your inbox for the verification link.",
          variant: "destructive"
        });
        return { error: { message: "Email not verified" } };
      }

      // Log successful login activity
      if (data.user && data.session) {
        setTimeout(async () => {
          try {
            await supabase.rpc('log_activity', {
              p_user_id: data.user!.id,
              p_entity_type: 'auth',
              p_entity_id: data.user!.id,
              p_action: 'login',
              p_description: `User logged in: ${data.user!.email}`,
              p_metadata: { email: data.user!.email },
              p_user_agent: navigator.userAgent,
              p_session_id: data.session!.access_token.substring(0, 36),
            });

            // Create user session record
            await supabase.from('user_sessions').insert({
              user_id: data.user!.id,
              session_id: data.session!.access_token.substring(0, 36),
              started_at: new Date().toISOString(),
              is_active: true,
              user_agent: navigator.userAgent,
              device_info: {
                platform: navigator.platform,
                language: navigator.language,
              },
            });
          } catch (err) {
            console.error('Failed to log login activity:', err);
          }
        }, 0);

        toast({
          title: "Welcome back!",
          description: "Successfully signed in."
        });
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    const currentUser = user;
    const currentSession = session;

    if (currentUser && currentSession) {
      setTimeout(async () => {
        try {
          await supabase.rpc('log_activity', {
            p_user_id: currentUser.id,
            p_entity_type: 'auth',
            p_entity_id: currentUser.id,
            p_action: 'logout',
            p_description: `User logged out: ${currentUser.email}`,
            p_metadata: { email: currentUser.email },
            p_session_id: currentSession.access_token.substring(0, 36),
          });
          await supabase.from('user_sessions').update({
            ended_at: new Date().toISOString(),
            is_active: false,
          }).match({ 
            session_id: currentSession.access_token.substring(0, 36),
            is_active: true 
          });
        } catch (err) {
          console.error('Failed to log logout:', err);
        }
      }, 0);
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({ title: "Sign out failed", description: error.message, variant: "destructive" });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};
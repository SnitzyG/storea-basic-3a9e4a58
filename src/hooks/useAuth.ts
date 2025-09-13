import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id: string;
  role: 'architect' | 'builder' | 'homeowner' | 'contractor';
  name: string;
  company_id?: string;
  avatar_url?: string;
  phone?: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    const initializeAuth = async () => {
      try {
        // Get initial session first
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error) {
          console.error('Error getting session:', error);
        }

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.email_confirmed_at) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        initialized = true;
        setLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.email || 'no user');
        
        // Skip INITIAL_SESSION if we already initialized
        if (event === 'INITIAL_SESSION' && initialized) {
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user?.email_confirmed_at) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        // Only set loading false after initial setup
        if (!initialized) {
          setLoading(false);
          initialized = true;
        }
      }
    );

    // Initialize auth
    initializeAuth();

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
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth?confirmed=true`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            role
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

      // Check if user needs email confirmation
      if (data.user && !data.session) {
        toast({
          title: "Sign up successful",
          description: "Please check your email to confirm your account before signing in."
        });
      } else if (data.session) {
        toast({
          title: "Account created",
          description: "Welcome to STOREA Basic!"
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
          description = "Please check your email and click the confirmation link before signing in.";
        }
        
        toast({
          title: "Sign in failed",
          description,
          variant: "destructive"
        });
        return { error };
      }

      if (data.user) {
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
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut
  };
};
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
    const initAuth = async () => {
      // FORCE LOGIN for local dev
      const mockUser = {
        id: 'mock-user-id',
        email: 'richard@storea.com',
        user_metadata: { name: 'Richard Architect', role: 'architect' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString()
      } as User;

      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser
      } as Session;

      setUser(mockUser);
      setSession(mockSession);

      // Fetch profile from LocalDB to ensure consistency
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', mockUser.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      } else {
        // Fallback if localDB is empty (shouldn't happen with seed)
        setProfile({
          id: 'prof-1',
          user_id: mockUser.id,
          role: 'architect',
          name: 'Richard Architect',
          email: 'richard@storea.com',
          approved: true
        });
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async () => {
    toast({ title: "Sign up disabled", description: "You are in local dev mode." });
    return { error: null };
  };

  const signIn = async () => {
    toast({ title: "Welcome back!", description: "Already logged in locally." });
    return { error: null };
  };

  const signOut = async () => {
    toast({ title: "Cannot sign out", description: "Local dev mode requires an active session." });
  };

  const refreshProfile = async () => {
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) setProfile(data);
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
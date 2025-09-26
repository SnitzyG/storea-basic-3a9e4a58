import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CompanyAvatar } from '@/components/ui/company-avatar';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { ProjectSelector } from './ProjectSelector';
import { ManageProfileDialog } from '@/components/profile/ManageProfileDialog';
import { supabase } from '@/integrations/supabase/client';

interface HeaderProps {
  user: User;
  profile?: Profile | null;
}

export const Header = ({
  user,
  profile
}: HeaderProps) => {
  const [companyName, setCompanyName] = useState<string | null>(null);
  const {
    signOut
  } = useAuth();
  const {
    theme,
    toggleTheme
  } = useTheme();

  // Fetch company name if profile has company_id
  useEffect(() => {
    const fetchCompanyName = async () => {
      if (profile?.company_id) {
        try {
          const { data, error } = await supabase
            .from('companies')
            .select('name')
            .eq('id', profile.company_id)
            .single();
          
          if (error) throw error;
          setCompanyName(data?.name || null);
        } catch (error) {
          console.error('Error fetching company name:', error);
          setCompanyName(null);
        }
      } else {
        setCompanyName(null);
      }
    };

    fetchCompanyName();
  }, [profile?.company_id]);

  const initials = ((profile?.name || user.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('') || 'U')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* STOREALite logo moved from sidebar */}
        <h1 className="text-xl font-bold tracking-wider">
          <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-black">
            STOREA
          </span>
          <span className="bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent font-light ml-1">
            Lite
          </span>
        </h1>
        <ProjectSelector />
      </div>

      <div className="flex items-center gap-4">
        <NotificationCenter />

        <Button variant="ghost" size="sm" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? '🌙' : '☀️'}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              {profile?.company_logo_url ? (
                <img 
                  src={profile.company_logo_url} 
                  alt="Company Logo" 
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <CompanyAvatar 
                  className="h-10 w-10"
                  companyLogoUrl={profile?.company_logo_url}
                  avatarUrl={profile?.avatar_url}
                  fallback={initials}
                />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile?.name || user.email || 'User'}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {(profile?.role ?? 'member')}
                </p>
                {companyName && (
                  <p className="text-xs leading-none text-muted-foreground pt-1 border-t border-border/50 mt-2">
                    <span className="font-medium">Company:</span> {companyName}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <ManageProfileDialog>
              <DropdownMenuItem className="text-foreground hover:text-foreground" onSelect={(e) => e.preventDefault()}>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Manage Profile</span>
              </DropdownMenuItem>
            </ManageProfileDialog>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
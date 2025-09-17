import { User } from '@supabase/supabase-js';
import { Profile } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User as UserIcon, Bell, Search } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/context/ThemeContext';
import { Badge } from '@/components/ui/badge';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { RealtimeIndicator } from '@/components/ui/realtime-indicator';
import { ProjectSelector } from './ProjectSelector';
import { ManageProfileDialog } from '@/components/profile/ManageProfileDialog';
interface HeaderProps {
  user: User;
  profile?: Profile | null;
}
export const Header = ({
  user,
  profile
}: HeaderProps) => {
  const {
    signOut
  } = useAuth();
  const {
    unreadCount
  } = useNotifications();
  const {
    theme,
    toggleTheme
  } = useTheme();
  const initials = ((profile?.name || user.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('') || 'U')
    .toUpperCase()
    .slice(0, 2);
  return <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <ProjectSelector />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <RealtimeIndicator />
        <NotificationCenter />

        <Button variant="ghost" size="sm" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? '🌙' : '☀️'}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || undefined} alt={(profile?.name || user.email || 'User')} />
                <AvatarFallback>{initials}</AvatarFallback>
                {/* Online indicator - green dot when connected */}
                <div className="absolute -bottom-0 -right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></div>
              </Avatar>
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
    </header>;
};
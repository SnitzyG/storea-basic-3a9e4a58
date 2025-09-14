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
interface HeaderProps {
  user: User;
  profile: Profile;
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
  const initials = profile.name.split(' ').map(name => name[0]).join('').toUpperCase();
  return <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>}
        </Button>

        <Button variant="ghost" size="sm" onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
          {theme === 'light' ? '🌙' : '☀️'}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{profile.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {profile.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Manage Profile</span>
            </DropdownMenuItem>
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
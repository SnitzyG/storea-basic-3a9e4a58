import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getAllUsers, disableUser, enableUser, changeUserRole } from '@/api/admin';
import { Search, UserX, UserCheck, Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function UserManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'email' | 'created' | 'lastLogin'>('created');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disableReason, setDisableReason] = useState('');

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
  });

  const filteredUsers = users?.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    switch (sortBy) {
      case 'email':
        return (a.email || '').localeCompare(b.email || '');
      case 'created':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'lastLogin':
        return new Date(b.lastSignInAt || 0).getTime() - new Date(a.lastSignInAt || 0).getTime();
      default:
        return 0;
    }
  });

  const handleDisableUser = async () => {
    if (!selectedUser) return;

    try {
      await disableUser(selectedUser.id, disableReason || 'No reason provided');
      toast({
        title: 'User Disabled',
        description: `${selectedUser.email} has been disabled.`,
      });
      refetch();
      setDisableDialogOpen(false);
      setDisableReason('');
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to disable user',
        variant: 'destructive',
      });
    }
  };

  const handleEnableUser = async (user: any) => {
    try {
      await enableUser(user.id);
      toast({
        title: 'User Enabled',
        description: `${user.email} has been enabled.`,
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to enable user',
        variant: 'destructive',
      });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string, userEmail: string) => {
    try {
      await changeUserRole(userId, newRole);
      toast({
        title: 'Role Updated',
        description: `${userEmail} role changed to ${newRole}.`,
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to change role',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle>All Users ({sortedUsers.length})</CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full sm:w-64"
                  />
                </div>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created">Created Date</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="lastLogin">Last Login</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-4 pb-2 border-b text-sm font-medium text-muted-foreground">
                  <div className="col-span-2">Email</div>
                  <div>Role</div>
                  <div>Status</div>
                  <div>Last Login</div>
                  <div className="text-right">Actions</div>
                </div>
                {sortedUsers.map((user) => (
                  <div key={user.id} className="grid grid-cols-6 gap-4 py-3 items-center border-b">
                    <div className="col-span-2 truncate font-medium">{user.email}</div>
                    <div>
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => handleRoleChange(user.id, newRole, user.email)}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Badge variant={user.status === 'active' ? 'secondary' : 'destructive'}>
                        {user.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.lastSignInAt ? format(new Date(user.lastSignInAt), 'MMM d, yyyy') : 'Never'}
                    </div>
                    <div className="flex justify-end gap-2">
                      {user.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setDisableDialogOpen(true);
                          }}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Disable
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEnableUser(user)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Enable
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {sortedUsers.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disable User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to disable {selectedUser?.email}? This will prevent them from accessing the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">Reason (optional)</label>
              <Input
                placeholder="Enter reason for disabling..."
                value={disableReason}
                onChange={(e) => setDisableReason(e.target.value)}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDisableReason('');
                setSelectedUser(null);
              }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDisableUser}>Disable User</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Phone, Building, Settings, Bell, Eye } from 'lucide-react';

export const UserProfile = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    avatar_url: profile?.avatar_url || '',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyDigest: true,
    projectUpdates: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone: formData.phone,
          avatar_url: formData.avatar_url,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      avatar_url: profile?.avatar_url || '',
    });
    setEditing(false);
  };

  if (!user || !profile) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-2xl">
                {profile.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{profile.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="capitalize">
                  {profile.role}
                </Badge>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <Button
            variant={editing ? "ghost" : "outline"}
            onClick={() => setEditing(!editing)}
          >
            {editing ? 'Cancel' : 'Edit'}
          </Button>
        </CardHeader>
        <CardContent>
          {editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={user.email}
                  disabled
                  className="mt-1 bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Email cannot be changed from this interface
                </p>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={profile.role}
                  disabled
                  className="mt-1 bg-muted capitalize"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Role is managed by system administrators
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Name:</span>
                  <span className="font-medium">{profile.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Phone:</span>
                  <span className="font-medium">{profile.phone || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <Badge variant="outline" className="capitalize">
                    {profile.role}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifications" className="text-sm font-medium">
                Email Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, emailNotifications: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="pushNotifications" className="text-sm font-medium">
                Push Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive real-time notifications in the app
              </p>
            </div>
            <Switch
              id="pushNotifications"
              checked={preferences.pushNotifications}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, pushNotifications: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weeklyDigest" className="text-sm font-medium">
                Weekly Digest
              </Label>
              <p className="text-xs text-muted-foreground">
                Weekly summary of project activities
              </p>
            </div>
            <Switch
              id="weeklyDigest"
              checked={preferences.weeklyDigest}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, weeklyDigest: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="projectUpdates" className="text-sm font-medium">
                Project Updates
              </Label>
              <p className="text-xs text-muted-foreground">
                Notifications for RFIs, tenders, and document updates
              </p>
            </div>
            <Switch
              id="projectUpdates"
              checked={preferences.projectUpdates}
              onCheckedChange={(checked) => 
                setPreferences({ ...preferences, projectUpdates: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Password</Label>
              <p className="text-xs text-muted-foreground">
                Last updated: Recent
              </p>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Two-Factor Authentication</Label>
              <p className="text-xs text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Active Sessions</Label>
              <p className="text-xs text-muted-foreground">
                Manage devices that have access to your account
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-1" />
              View Sessions
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
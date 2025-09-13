import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Download, 
  Users, 
  Crown, 
  UserX, 
  FileSpreadsheet,
  Mail,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2
} from 'lucide-react';

interface TeamMember {
  user_id: string;
  role: string;
  joined_at: string;
  invited_by: string;
  name?: string;
  email?: string;
  last_seen?: string;
  online_status?: boolean;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  inviter_id: string;
  created_at: string;
  expires_at: string;
  token: string;
  status: string;
}

interface BulkInviteData {
  email: string;
  role: string;
  name?: string;
}

export const AdvancedUserManagement = ({ projectId }: { projectId: string }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [bulkInviteData, setBulkInviteData] = useState<BulkInviteData[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState('');

  const { user, profile } = useAuth();
  const { projects } = useProjects();
  const { toast } = useToast();

  const currentProject = projects?.find(p => p.id === projectId);
  const isProjectOwner = currentProject?.created_by === user?.id;

  useEffect(() => {
    loadTeamData();
  }, [projectId]);

  const loadTeamData = async () => {
    if (!projectId) return;

    try {
      // Load team members
      const { data: members, error: membersError } = await supabase
        .from('project_users')
        .select(`
          user_id,
          role,
          joined_at,
          invited_by,
          profiles:user_id (
            name,
            last_seen,
            online_status
          )
        `)
        .eq('project_id', projectId);

      if (membersError) throw membersError;

      // Load pending invitations
      const { data: invitations, error: invitationsError } = await supabase
        .from('invitations')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (invitationsError) throw invitationsError;

      setTeamMembers(members || []);
      setPendingInvitations(invitations || []);
    } catch (error) {
      console.error('Error loading team data:', error);
      toast({
        title: "Error loading team data",
        description: "Please refresh the page to try again.",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const invites: BulkInviteData[] = [];

      // Skip header row and parse CSV
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const [email, role, name] = line.split(',').map(item => item.trim().replace(/"/g, ''));
          if (email && role) {
            invites.push({
              email,
              role: role,
              name: name || undefined
            });
          }
        }
      }

      setBulkInviteData(invites);
      toast({
        title: "CSV uploaded successfully",
        description: `${invites.length} invitations ready to send.`
      });
    };

    reader.readAsText(file);
  };

  const sendBulkInvitations = async () => {
    if (bulkInviteData.length === 0) return;

    setLoading(true);
    let successCount = 0;
    let failureCount = 0;

    for (const invite of bulkInviteData) {
      try {
        const { error } = await supabase.functions.invoke('send-team-invitation', {
          body: {
            projectId,
            email: invite.email,
            role: invite.role,
            customMessage: customMessage || undefined,
            inviteeName: invite.name
          }
        });

        if (error) throw error;
        successCount++;
      } catch (error) {
        console.error(`Failed to send invitation to ${invite.email}:`, error);
        failureCount++;
      }
    }

    setLoading(false);
    setBulkInviteData([]);
    
    toast({
      title: "Bulk invitations completed",
      description: `${successCount} invitations sent successfully. ${failureCount} failed.`,
      variant: failureCount > 0 ? "destructive" : "default"
    });

    await loadTeamData();
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('project_users')
        .update({ role: newRole as any })
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Role updated successfully",
        description: "Team member role has been changed."
      });

      await loadTeamData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error updating role",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const transferProjectOwnership = async () => {
    if (!selectedNewOwner || !currentProject) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({ created_by: selectedNewOwner })
        .eq('id', projectId);

      if (error) throw error;

      toast({
        title: "Ownership transferred",
        description: "Project ownership has been successfully transferred."
      });

      setTransferOwnershipOpen(false);
      setSelectedNewOwner('');
    } catch (error) {
      console.error('Error transferring ownership:', error);
      toast({
        title: "Error transferring ownership",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;

      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled."
      });

      await loadTeamData();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Error cancelling invitation",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const downloadTemplate = () => {
    const csvContent = "email,role,name\nexample@company.com,contractor,John Doe\nteam@company.com,architect,Jane Smith";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team_invitation_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const removeFromBulkList = (index: number) => {
    setBulkInviteData(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Advanced User Management
          </CardTitle>
          <CardDescription>
            Manage team members, roles, and bulk invitations for your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="bulk-invite">Bulk Invite</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Team Members ({teamMembers.length})</h3>
                
                {teamMembers.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${member.online_status ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <span className="font-medium">{member.name || 'Unknown User'}</span>
                      </div>
                      <Badge variant="secondary">{member.role}</Badge>
                      {currentProject?.created_by === member.user_id && (
                        <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Owner
                        </Badge>
                      )}
                    </div>
                    
                    {isProjectOwner && member.user_id !== user?.id && (
                      <div className="flex items-center gap-2">
                        <Select
                          value={member.role}
                          onValueChange={(value) => changeUserRole(member.user_id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="architect">Architect</SelectItem>
                            <SelectItem value="builder">Builder</SelectItem>
                            <SelectItem value="contractor">Contractor</SelectItem>
                            <SelectItem value="homeowner">Homeowner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bulk-invite" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Bulk Team Invitations</h3>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csv-upload">Upload CSV File</Label>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload a CSV with columns: email, role, name (optional)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="custom-message">Custom Message (Optional)</Label>
                    <Textarea
                      id="custom-message"
                      placeholder="Add a personal message to the invitation email..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  {bulkInviteData.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Invitations to Send ({bulkInviteData.length})</h4>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {bulkInviteData.map((invite, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span className="text-sm">{invite.email}</span>
                              <Badge variant="outline">{invite.role}</Badge>
                              {invite.name && <span className="text-sm text-muted-foreground">({invite.name})</span>}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromBulkList(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button
                        onClick={sendBulkInvitations}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? 'Sending Invitations...' : `Send ${bulkInviteData.length} Invitations`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pending Invitations ({pendingInvitations.length})</h3>
                
                {pendingInvitations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No pending invitations
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pendingInvitations.map((invitation) => (
                      <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <div>
                            <span className="font-medium">{invitation.email}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{invitation.role}</Badge>
                              <span className="text-sm text-muted-foreground">
                                Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelInvitation(invitation.id)}
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              {isProjectOwner && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
                    <Separator className="my-4" />
                    
                    <Dialog open={transferOwnershipOpen} onOpenChange={setTransferOwnershipOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                          <Crown className="h-4 w-4 mr-2" />
                          Transfer Project Ownership
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            Transfer Project Ownership
                          </DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. You will lose administrative privileges for this project.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div>
                            <Label>Select New Owner</Label>
                            <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose team member" />
                              </SelectTrigger>
                              <SelectContent>
                                {teamMembers
                                  .filter(member => member.user_id !== user?.id)
                                  .map((member) => (
                                    <SelectItem key={member.user_id} value={member.user_id}>
                                      {member.name || 'Unknown User'} ({member.role})
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setTransferOwnershipOpen(false)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={transferProjectOwnership}
                              disabled={!selectedNewOwner}
                              className="flex-1"
                            >
                              Transfer Ownership
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Users, Share, X, Check, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/hooks/useDocuments';

interface DocumentShare {
  id: string;
  shared_with: string;
  permission_level: string;
  created_at: string;
  shared_with_profile?: {
    name: string;
    role: string;
  };
}

interface DocumentSharingDialogProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export const DocumentSharingDialog: React.FC<DocumentSharingDialogProps> = ({
  document,
  isOpen,
  onClose,
  projectId
}) => {
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [permissionLevel, setPermissionLevel] = useState<string>('view');
  const [existingShares, setExistingShares] = useState<DocumentShare[]>([]);
  const [loading, setLoading] = useState(false);
  const { teamMembers } = useProjectTeam(projectId);
  const { profile } = useAuth();
  const { toast } = useToast();

  // Load existing shares when dialog opens
  useEffect(() => {
    if (isOpen && document) {
      loadExistingShares();
    }
  }, [isOpen, document]);

  const loadExistingShares = async () => {
    if (!document) return;

    try {
      // First get the shares
      const { data: shares, error: sharesError } = await supabase
        .from('document_shares')
        .select('id, shared_with, permission_level, created_at, shared_by')
        .eq('document_id', document.id);

      if (sharesError) throw sharesError;

      if (shares && shares.length > 0) {
        // Get profile information for shared users
        const userIds = shares.map(share => share.shared_with);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name, role')
          .in('user_id', userIds);

        if (profilesError) {
          console.warn('Could not load profile information:', profilesError);
        }

        // Combine shares with profile data
        const sharesWithProfiles = shares.map(share => ({
          ...share,
          shared_with_profile: profiles?.find(p => p.user_id === share.shared_with) || {
            name: 'Unknown User',
            role: 'Unknown'
          }
        }));

        setExistingShares(sharesWithProfiles);
      } else {
        setExistingShares([]);
      }
    } catch (error) {
      console.error('Error loading shares:', error);
      setExistingShares([]);
      toast({
        title: "Warning",
        description: "Could not load existing shares. You can still create new shares.",
        variant: "default"
      });
    }
  };

  const handleShare = async () => {
    if (!document || !selectedUser || !profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('document_shares')
        .insert({
          document_id: document.id,
          shared_by: profile.user_id,
          shared_with: selectedUser,
          permission_level: 'view' // Standard access for team members
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document shared successfully",
      });

      // Reload shares and reset form
      await loadExistingShares();
      setSelectedUser('');
    } catch (error: any) {
      console.error('Error sharing document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to share document",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('document_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Share removed successfully",
      });

      await loadExistingShares();
    } catch (error: any) {
      console.error('Error removing share:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to remove share",
        variant: "destructive"
      });
    }
  };

  const availableUsers = teamMembers.filter(member => 
    member.user_id !== profile?.user_id && 
    !existingShares.some(share => share.shared_with === member.user_id)
  );

  const getPermissionBadgeVariant = (level: string) => {
    switch (level) {
      case 'edit': return 'default';
      case 'download': return 'secondary';
      default: return 'outline';
    }
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share Document: {document.title || document.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Visibility Status */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Current Visibility</h4>
                  <p className="text-sm text-muted-foreground">
                    {document.visibility_scope === 'private' 
                      ? 'Private - Only visible to you and people you share with'
                      : 'Project - Visible to all project members'
                    }
                  </p>
                </div>
                <Badge variant={document.visibility_scope === 'private' ? 'secondary' : 'outline'}>
                  {document.visibility_scope === 'private' ? 'Private' : 'Public'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Only show sharing options for private documents or document owners */}
          {(document.visibility_scope === 'private' || document.uploaded_by === profile?.user_id) && (
            <>
              {/* Share with new user */}
              <div className="space-y-4">
                <h4 className="font-medium">Share with team member</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Team Member</Label>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team member" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((member) => (
                          <SelectItem key={member.user_id} value={member.user_id}>
                            <div className="flex items-center gap-2">
                              <span>{member.user_profile?.name || member.name || 'Unknown'}</span>
                              <Badge variant="outline" className="text-xs">
                                {member.role}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Team members will get standard view access to this document.
                    </p>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={handleShare}
                      disabled={!selectedUser || loading}
                      className="w-full"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {loading ? 'Sharing...' : 'Share with Team Member'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Existing shares */}
              {existingShares.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Currently shared with</h4>
                  
                  <div className="space-y-2">
                    {existingShares.map((share) => (
                      <Card key={share.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">
                                  {share.shared_with_profile?.name || 'Unknown User'}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {share.shared_with_profile?.role || 'Unknown'}
                              </Badge>
                              <Badge variant={getPermissionBadgeVariant(share.permission_level)}>
                                {share.permission_level}
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                Shared {new Date(share.created_at).toLocaleDateString()}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveShare(share.id)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Info for non-private documents */}
          {document.visibility_scope !== 'private' && document.uploaded_by !== profile?.user_id && (
            <Card>
              <CardContent className="p-4">
                <div className="text-center text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>This document is visible to all project members.</p>
                  <p className="text-sm">Only the document owner can manage sharing.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useState, useEffect } from 'react';
import { Users, Share, X, Check, Mail, UserPlus, UsersIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
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
    if (!document || selectedMembers.size === 0 || !profile) return;

    setLoading(true);
    try {
      // Create shares for all selected members
      const shareInserts = Array.from(selectedMembers).map(memberId => ({
        document_id: document.id,
        shared_by: profile.user_id,
        shared_with: memberId,
        permission_level: 'view' // Standard access for team members
      }));

      const { error } = await supabase
        .from('document_shares')
        .insert(shareInserts);

      if (error) throw error;

      const count = selectedMembers.size;
      toast({
        title: "Success",
        description: `Document shared with ${count} team member${count > 1 ? 's' : ''}`,
      });

      // Reload shares and reset form
      await loadExistingShares();
      setSelectedMembers(new Set());
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

  const handleShareWithAll = async () => {
    if (!document || !profile) return;

    const availableMembers = teamMembers.filter(member => 
      member.user_id !== profile.user_id && 
      !existingShares.some(share => share.shared_with === member.user_id)
    );

    if (availableMembers.length === 0) {
      toast({
        title: "Info",
        description: "Document is already shared with all team members",
      });
      return;
    }

    setLoading(true);
    try {
      const shareInserts = availableMembers.map(member => ({
        document_id: document.id,
        shared_by: profile.user_id,
        shared_with: member.user_id,
        permission_level: 'view'
      }));

      const { error } = await supabase
        .from('document_shares')
        .insert(shareInserts);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Document shared with all team members (${availableMembers.length} members)`,
      });

      await loadExistingShares();
    } catch (error: any) {
      console.error('Error sharing with all:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to share with all members",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnshareMember = async (memberId: string) => {
    const shareToRemove = existingShares.find(share => share.shared_with === memberId);
    if (shareToRemove) {
      await handleRemoveShare(shareToRemove.id);
    }
  };

  const handleToggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
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

  // All team members except the current user
  const allTeamMembers = teamMembers.filter(member => 
    member.user_id !== profile?.user_id
  );

  // Available members (not yet shared with)
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
                      ? 'Private - Only visible to you and people you share with (Recommended)'
                      : 'Project - Visible to all project members'
                    }
                  </p>
                </div>
                <Badge variant={document.visibility_scope === 'private' ? 'default' : 'outline'}>
                  {document.visibility_scope === 'private' ? 'Private' : 'Public'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Show sharing options for all documents in the project */}
          {true && (
            <>
              {/* Team Members List with Checkboxes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Share with team members</h4>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMembers(new Set())}
                      disabled={selectedMembers.size === 0}
                    >
                      Unselect All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareWithAll}
                      disabled={loading || availableUsers.length === 0}
                    >
                      <UsersIcon className="h-4 w-4 mr-2" />
                      Share with All
                    </Button>
                  </div>
                </div>

                {/* Team Members Grid */}
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {allTeamMembers.map((member) => {
                    const isShared = existingShares.some(share => share.shared_with === member.user_id);
                    const isSelected = selectedMembers.has(member.user_id);
                    
                    return (
                      <Card key={member.user_id} className={`p-3 ${isShared ? 'bg-muted/50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggleMember(member.user_id)}
                              disabled={isShared}
                            />
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {member.user_profile?.name || member.name || 'Unknown'}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {member.role}
                              </Badge>
                              {isShared && (
                                <Badge variant="secondary" className="text-xs">
                                  Shared
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {isShared && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUnshareMember(member.user_id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Share Selected Button */}
                {selectedMembers.size > 0 && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleShare}
                      disabled={loading}
                      className="min-w-[160px]"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      {loading ? 'Sharing...' : `Share with ${selectedMembers.size} member${selectedMembers.size > 1 ? 's' : ''}`}
                    </Button>
                  </div>
                )}
              </div>

              {/* Summary */}
              {existingShares.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Document Access Summary</h4>
                  <Card>
                    <CardContent className="p-3">
                      <div className="text-sm text-muted-foreground">
                        Currently shared with <strong>{existingShares.length}</strong> team member{existingShares.length !== 1 ? 's' : ''} 
                        out of <strong>{allTeamMembers.length}</strong> total team members.
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}

          {/* Info section removed as all users can now manage sharing */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

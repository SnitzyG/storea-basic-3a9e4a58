import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DocumentGroup {
  id: string;
  project_id: string;
  document_number?: string;
  title: string;
  category: string;
  current_revision_id?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  status: string; // Changed from union type to string to match database
  visibility_scope: string;
  is_locked: boolean;
  locked_by?: string;
  locked_at?: string;
  // Joined from current revision
  current_revision?: DocumentRevision;
}

export interface DocumentRevision {
  id: string;
  document_group_id?: string; // Optional for joined data
  revision_number: number;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  file_extension?: string;
  uploaded_by: string;
  uploaded_by_name?: string;
  uploaded_by_role?: string;
  changes_summary?: string;
  is_current: boolean;
  is_archived: boolean;
  created_at: string;
}

export const useDocumentGroups = (projectId?: string) => {
  const [documentGroups, setDocumentGroups] = useState<DocumentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocumentGroups = useCallback(async (filterProjectId?: string) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDocumentGroups([]);
        setLoading(false);
        return;
      }

      // Only fetch documents for specified project and ensure user permissions
      if (!filterProjectId && !projectId) {
        setDocumentGroups([]);
        setLoading(false);
        return;
      }

      const targetProjectId = filterProjectId || projectId;

      // Verify user is member of the project
      const { data: membership } = await supabase
        .from('project_users')
        .select('user_id')
        .eq('project_id', targetProjectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        // User is not a member of this project
        setDocumentGroups([]);
        setLoading(false);
        return;
      }

      // Build query for documents where user is either:
      // 1. Creator of the document
      // 2. Document has been shared with them
      // 3. Document visibility is 'project' (visible to all project members)
      const { data, error } = await supabase
        .from('document_groups')
        .select('*')
        .eq('project_id', targetProjectId)
        .or(`created_by.eq.${user.id},visibility_scope.eq.project`)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Document groups fetch error:', error);
        throw error;
      }

      let filteredData = data || [];

      // Fetch current revisions separately and add them to the groups
      let dataWithRevisions: any[] = filteredData;
      
      if (filteredData.length > 0) {
        const groupIds = filteredData.map(g => g.current_revision_id).filter(Boolean);
        
        if (groupIds.length > 0) {
          const { data: revisions } = await supabase
            .from('document_revisions')
            .select('*')
            .in('id', groupIds);

          // Map revisions to groups
          const revisionsMap = new Map(revisions?.map(r => [r.id, r]) || []);
          dataWithRevisions = filteredData.map(group => ({
            ...group,
            current_revision: group.current_revision_id ? revisionsMap.get(group.current_revision_id) : null
          }));
        }
      }

      // Additional check for shared documents if user is not the creator
      if (dataWithRevisions.length > 0) {
        const nonOwnedDocs = dataWithRevisions.filter(doc => doc.created_by !== user.id);
        
        if (nonOwnedDocs.length > 0) {
          // Check for shared documents
          const { data: sharedDocs } = await supabase
            .from('document_shares')
            .select('document_id')
            .eq('shared_with', user.id);

          const sharedDocIds = new Set(sharedDocs?.map(share => share.document_id) || []);
          
          // Filter out private documents that aren't shared with the user
          dataWithRevisions = dataWithRevisions.filter(doc => 
            doc.created_by === user.id || 
            doc.visibility_scope === 'project' ||
            sharedDocIds.has(doc.id)
          );
        }
      }

      // Get user names for uploaded_by
      const userIds = [...new Set(dataWithRevisions?.map(group => group.current_revision?.uploaded_by).filter(Boolean) || [])];
      let userNames: Record<string, { name: string; role: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name, role')
          .in('user_id', userIds);
        
        userNames = Object.fromEntries(profiles?.map(p => [p.user_id, { name: p.name, role: p.role }]) || []);
      }

      // Enhance data with user names
      const enhancedData = dataWithRevisions?.map(group => ({
        ...group,
        current_revision: group.current_revision ? {
          ...group.current_revision,
          uploaded_by_name: userNames[group.current_revision.uploaded_by]?.name || 'Unknown User',
          uploaded_by_role: userNames[group.current_revision.uploaded_by]?.role || 'unknown'
        } : null
      })) || [];
      
      setDocumentGroups(enhancedData);
    } catch (error: any) {
      console.error('Error fetching document groups:', error);
      toast({
        title: "Error fetching documents",
        description: error.message || "Failed to load documents. Please try again.",
        variant: "destructive"
      });
      setDocumentGroups([]);
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  const createDocumentGroup = useCallback(async (
    file: File,
    projectId: string,
    title?: string,
    metadata?: {
      documentNumber?: string;
      status: string;
      category: string;
      projectStage?: string;
      isPrivate?: boolean;
    }
  ): Promise<DocumentGroup | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Upload file first
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const filePath = `${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document group
      const { data: groupData, error: groupError } = await supabase
        .from('document_groups')
        .insert({
          project_id: projectId,
          title: title || file.name.replace(/\.[^/.]+$/, ''),
          category: metadata?.category || 'Architectural',
          project_stage: metadata?.projectStage || 'General',
          created_by: user.id,
          status: metadata?.status || 'For Information',
          visibility_scope: metadata?.isPrivate ? 'private' : 'project',
          document_number: metadata?.documentNumber
        })
        .select()
        .maybeSingle();

      if (groupError) throw groupError;

      // Create first revision
      const { data: revisionData, error: revisionError } = await supabase
        .from('document_revisions')
        .insert({
          document_group_id: groupData.id,
          revision_number: 1,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          file_extension: fileExt,
          uploaded_by: user.id,
          is_current: true
        })
        .select()
        .maybeSingle();

      if (revisionError) throw revisionError;

      // Update group with current revision
      const { error: updateError } = await supabase
        .from('document_groups')
        .update({ current_revision_id: revisionData.id })
        .eq('id', groupData.id);

      if (updateError) throw updateError;

      // Log activity
      await supabase
        .from('activity_log')
        .insert({
          user_id: user.id,
          project_id: projectId,
          entity_type: 'document_group',
          entity_id: groupData.id,
          action: 'created',
          description: `Created document: "${title || file.name}"`,
          metadata: { 
            file_type: file.type,
            file_size: file.size,
            category: metadata?.category
          }
        });

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      await fetchDocumentGroups();
      return { ...groupData, current_revision: revisionData };
    } catch (error: any) {
      console.error('Error creating document group:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
      return null;
    }
  }, [fetchDocumentGroups, toast]);

  const supersedeDocument = useCallback(async (
    groupId: string,
    file: File,
    changesSummary?: string
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get document group
      const { data: group, error: groupError } = await supabase
        .from('document_groups')
        .select('project_id')
        .eq('id', groupId)
        .maybeSingle();

      if (!group) {
        throw new Error('Document group not found');
      }

      if (groupError) throw groupError;

      // Upload new file
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
      const filePath = `${group.project_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Use the supersede function
      const { data, error } = await supabase.rpc('create_document_supersede', {
        group_id: groupId,
        new_file_name: file.name,
        new_file_path: filePath,
        new_file_type: file.type,
        new_file_size: file.size,
        new_file_extension: fileExt,
        changes_summary: changesSummary
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document superseded successfully",
      });

      await fetchDocumentGroups();
      return true;
    } catch (error: any) {
      console.error('Error superseding document:', error);
      toast({
        title: "Error",
        description: "Failed to supersede document",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchDocumentGroups, toast]);

  const deleteDocumentGroup = useCallback(async (groupId: string): Promise<boolean> => {
    try {
      // Get all revisions to delete files
      const { data: revisions } = await supabase
        .from('document_revisions')
        .select('file_path')
        .eq('document_group_id', groupId);

      // Delete files from storage
      if (revisions && revisions.length > 0) {
        const filePaths = revisions.map(r => r.file_path);
        await supabase.storage.from('documents').remove(filePaths);
      }

      // Delete document group (cascades to revisions)
      const { error } = await supabase
        .from('document_groups')
        .delete()
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      await fetchDocumentGroups();
      return true;
    } catch (error: any) {
      console.error('Error deleting document group:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchDocumentGroups, toast]);

  const getDocumentRevisions = useCallback(async (groupId: string): Promise<DocumentRevision[]> => {
    try {
      const { data, error } = await supabase
        .from('document_revisions')
        .select('*')
        .eq('document_group_id', groupId)
        .order('revision_number', { ascending: false });

      if (error) throw error;

      // Get user names
      const userIds = [...new Set(data?.map(r => r.uploaded_by) || [])];
      let userNames: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', userIds);
        
        userNames = Object.fromEntries(profiles?.map(p => [p.user_id, p.name]) || []);
      }

      return data?.map(revision => ({
        ...revision,
        uploaded_by_name: userNames[revision.uploaded_by] || 'Unknown User'
      })) || [];
    } catch (error: any) {
      console.error('Error fetching document revisions:', error);
      return [];
    }
  }, []);

  const toggleDocumentLock = useCallback(async (groupId: string, shouldLock: boolean): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updates: any = {
        is_locked: shouldLock,
        locked_at: shouldLock ? new Date().toISOString() : null,
        locked_by: shouldLock ? user?.id ?? null : null,
      };

      const { error } = await supabase
        .from('document_groups')
        .update(updates)
        .eq('id', groupId);

      if (error) throw error;

      toast({ title: "Success", description: `Document ${shouldLock ? 'locked' : 'unlocked'} successfully` });
      await fetchDocumentGroups();
      return true;
    } catch (error: any) {
      console.error('Error toggling document lock:', error);
      toast({ title: "Error", description: `Failed to ${shouldLock ? 'lock' : 'unlock'} document`, variant: "destructive" });
      return false;
    }
  }, [fetchDocumentGroups, toast]);

  const updateDocumentMetadata = useCallback(async (
    groupId: string, 
    updates: {
      title?: string;
      category?: string;
      status?: string;
      visibility_scope?: string;
    }
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('document_groups')
        .update({
          ...(updates.title !== undefined ? { title: updates.title } : {}),
          ...(updates.category !== undefined ? { category: updates.category } : {}),
          ...(updates.status !== undefined ? { status: updates.status } : {}),
          ...(updates.visibility_scope !== undefined ? { visibility_scope: updates.visibility_scope } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', groupId);

      if (error) throw error;

      toast({ title: "Success", description: "Document updated successfully" });
      await fetchDocumentGroups();
      return true;
    } catch (error: any) {
      console.error('Error updating document metadata:', error);
      toast({ title: "Error", description: "Failed to update document", variant: "destructive" });
      return false;
    }
  }, [fetchDocumentGroups, toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!projectId) return;
    
    const documentsChannel = supabase
      .channel('document_groups_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'document_groups',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          console.log('Document groups change:', payload);
          fetchDocumentGroups();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'document_revisions' },
        (payload) => {
          console.log('Document revisions change:', payload);
          fetchDocumentGroups();
        }
      )
      .on('postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'document_shares'
        },
        (payload) => {
          console.log('Document shares change:', payload);
          fetchDocumentGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(documentsChannel);
    };
  }, [projectId, fetchDocumentGroups]);

  // Fetch document groups when projectId changes
  useEffect(() => {
    fetchDocumentGroups();
  }, [fetchDocumentGroups]);

  return {
    documentGroups,
    loading,
    fetchDocumentGroups,
    createDocumentGroup,
    supersedeDocument,
    deleteDocumentGroup,
    getDocumentRevisions,
    toggleDocumentLock,
    updateDocumentMetadata
  };
};
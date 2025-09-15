import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DocumentVersion } from '@/hooks/useDocuments';

interface UseDocumentVersionsReturn {
  createVersion: (documentId: string, file: File, changesSummary?: string) => Promise<DocumentVersion | null>;
  getVersions: (documentId: string) => Promise<DocumentVersion[]>;
  archiveCurrentVersion: (documentId: string) => Promise<boolean>;
  revertToVersion: (documentId: string, versionId: string) => Promise<boolean>;
  loading: boolean;
}

export const useDocumentVersions = (): UseDocumentVersionsReturn => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createVersion = useCallback(async (
    documentId: string, 
    file: File, 
    changesSummary?: string
  ): Promise<DocumentVersion | null> => {
    setLoading(true);
    try {
      // Get current document to determine next version number
      const { data: currentDoc, error: docError } = await supabase
        .from('documents')
        .select('version, project_id')
        .eq('id', documentId)
        .single();

      if (docError) throw docError;

      const nextVersion = (currentDoc.version || 1) + 1;
      
      // Generate file path for new version
      const fileExtension = file.name.split('.').pop() || 'bin';
      const filePath = `${currentDoc.project_id}/versions/${documentId}-v${nextVersion}-${Date.now()}.${fileExtension}`;

      // Upload new version to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Create version record
      const { data: versionData, error: versionError } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number: nextVersion,
          file_path: filePath,
          uploaded_by: user.id,
          changes_summary: changesSummary
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Update document version number
      await supabase
        .from('documents')
        .update({ version: nextVersion })
        .eq('id', documentId);

      // Log activity
      await supabase
        .from('activity_log')
        .insert({
          user_id: user.id,
          entity_type: 'document',
          entity_id: documentId,
          action: 'version_created',
          description: `Created version ${nextVersion}${changesSummary ? `: ${changesSummary}` : ''}`,
          metadata: { version: nextVersion, changes_summary: changesSummary }
        });

      toast({
        title: "Success",
        description: `Version ${String.fromCharCode(64 + nextVersion)} created successfully`,
      });

      return versionData;
    } catch (error: any) {
      console.error('Error creating version:', error);
      toast({
        title: "Error",
        description: "Failed to create new version",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getVersions = useCallback(async (documentId: string): Promise<DocumentVersion[]> => {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching versions:', error);
      return [];
    }
  }, []);

  const archiveCurrentVersion = useCallback(async (documentId: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Get current document
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError) throw docError;

      // Create archive version entry
      const { error: archiveError } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number: document.version || 1,
          file_path: document.file_path,
          uploaded_by: document.uploaded_by,
          changes_summary: 'Archived before superseding'
        });

      if (archiveError) throw archiveError;

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('activity_log')
          .insert({
            user_id: user.id,
            entity_type: 'document',
            entity_id: documentId,
            action: 'archived',
            description: `Document archived before superseding`,
            metadata: { version: document.version || 1 }
          });
      }

      return true;
    } catch (error: any) {
      console.error('Error archiving version:', error);
      toast({
        title: "Error",
        description: "Failed to archive current version",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const revertToVersion = useCallback(async (
    documentId: string, 
    versionId: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      // Get version data
      const { data: version, error: versionError } = await supabase
        .from('document_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (versionError) throw versionError;

      // Archive current version first
      await archiveCurrentVersion(documentId);

      // Update document to point to the reverted version
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          file_path: version.file_path,
          version: version.version_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('activity_log')
          .insert({
            user_id: user.id,
            entity_type: 'document',
            entity_id: documentId,
            action: 'reverted',
            description: `Reverted to version ${String.fromCharCode(64 + version.version_number)}`,
            metadata: { 
              reverted_to_version: version.version_number,
              reverted_version_id: versionId
            }
          });
      }

      toast({
        title: "Success",
        description: `Reverted to version ${String.fromCharCode(64 + version.version_number)}`,
      });

      return true;
    } catch (error: any) {
      console.error('Error reverting to version:', error);
      toast({
        title: "Error",
        description: "Failed to revert to selected version",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, archiveCurrentVersion]);

  return {
    createVersion,
    getVersions,
    archiveCurrentVersion,
    revertToVersion,
    loading
  };
};
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface DocumentShare {
  id: string;
  document_id: string;
  shared_by: string;
  shared_with: string;
  permission_level: string;
  created_at: string;
  expires_at?: string;
}

interface UseDocumentSharingReturn {
  shareDocument: (documentId: string, sharedWith: string, permissionLevel: string) => Promise<boolean>;
  unshareDocument: (shareId: string) => Promise<boolean>;
  getDocumentShares: (documentId: string) => Promise<DocumentShare[]>;
  getSharedWithMe: () => Promise<DocumentShare[]>;
  loading: boolean;
}

export const useDocumentSharing = (): UseDocumentSharingReturn => {
  const [loading, setLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const shareDocument = useCallback(async (
    documentId: string, 
    sharedWith: string, 
    permissionLevel: string
  ): Promise<boolean> => {
    if (!profile) return false;

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('document_shares')
        .insert({
          document_id: documentId,
          shared_by: profile.user_id,
          shared_with: sharedWith,
          permission_level: permissionLevel
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document shared successfully",
      });

      return true;
    } catch (error: any) {
      console.error('Error sharing document:', error);
      
      let errorMessage = "Failed to share document";
      if (error.code === '23505') { // Unique constraint violation
        errorMessage = "Document is already shared with this user";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  const unshareDocument = useCallback(async (shareId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from('document_shares')
        .delete()
        .eq('id', shareId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document share removed successfully",
      });

      return true;
    } catch (error: any) {
      console.error('Error removing document share:', error);
      toast({
        title: "Error",
        description: "Failed to remove document share",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getDocumentShares = useCallback(async (documentId: string): Promise<DocumentShare[]> => {
    try {
      const { data, error } = await (supabase as any)
        .from('document_shares')
        .select('*')
        .eq('document_id', documentId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching document shares:', error);
      return [];
    }
  }, []);

  const getSharedWithMe = useCallback(async (): Promise<DocumentShare[]> => {
    if (!profile) return [];

    try {
      const { data, error } = await (supabase as any)
        .from('document_shares')
        .select(`
          *,
          document:documents(
            id,
            title,
            name,
            file_type,
            created_at,
            uploaded_by,
            project_id
          )
        `)
        .eq('shared_with', profile.user_id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shared documents:', error);
      return [];
    }
  }, [profile]);

  return {
    shareDocument,
    unshareDocument,
    getDocumentShares,
    getSharedWithMe,
    loading
  };
};
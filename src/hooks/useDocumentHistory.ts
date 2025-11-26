import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DocumentHistoryItem {
  id: string;
  type: 'created' | 'version_created' | 'viewed' | 'downloaded' | 'shared' | 'superseded' | 'archived' | 'reverted' | 'transmitted';
  timestamp: string;
  user_name: string;
  user_id: string;
  details: string;
  version?: number;
  metadata?: {
    file_path?: string;
    file_name?: string;
    file_size?: number;
    changes_summary?: string;
    version_number?: number;
    [key: string]: any;
  };
}

export interface DocumentRevision {
  id: string;
  document_id: string;
  version_number: number;
  file_path: string;
  file_name: string;
  file_size?: number;
  uploaded_by: string;
  uploaded_by_name: string;
  changes_summary?: string;
  created_at: string;
  is_current: boolean;
}

export interface UseDocumentHistoryReturn {
  getDocumentHistory: (documentId: string) => Promise<DocumentHistoryItem[]>;
  getDocumentRevisions: (documentId: string) => Promise<DocumentRevision[]>;
  loading: boolean;
}

export const useDocumentHistory = (): UseDocumentHistoryReturn => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getDocumentHistory = useCallback(async (documentId: string): Promise<DocumentHistoryItem[]> => {
    try {
      setLoading(true);
      
      // Get activity log entries with user names
      const { data: activities, error: activitiesError } = await supabase
        .from('activity_log')
        .select(`
          id,
          action,
          description,
          created_at,
          metadata,
          user_id
        `)
        .eq('entity_id', documentId)
        .eq('entity_type', 'document')
        .order('created_at', { ascending: false });

      if (activitiesError) throw activitiesError;

      // Get user names for activities
      const activityUserIds = activities?.map(a => a.user_id) || [];
      const { data: activityUsers } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', activityUserIds);

      // Get document versions with user names
      const { data: versions, error: versionsError } = await supabase
        .from('document_versions')
        .select(`
          id,
          version_number,
          file_path,
          changes_summary,
          created_at,
          uploaded_by
        `)
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (versionsError) throw versionsError;

      // Get user names for versions
      const versionUserIds = versions?.map(v => v.uploaded_by) || [];
      const { data: versionUsers } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', versionUserIds);

      // Get current document info
      const { data: currentDoc, error: docError } = await supabase
        .from('documents')
        .select(`
          name,
          created_at,
          uploaded_by,
          version
        `)
        .eq('id', documentId)
        .maybeSingle();

      if (!currentDoc) {
        throw new Error('Document not found');
      }

      if (docError) throw docError;

      // Get current document user name
      const { data: currentDocUser } = await supabase
        .from('profiles')
        .select('user_id, name')
        .eq('user_id', currentDoc.uploaded_by)
        .maybeSingle();

      const historyItems: DocumentHistoryItem[] = [];

      // Add current document creation
      historyItems.push({
        id: `doc-created-${documentId}`,
        type: 'created',
        timestamp: currentDoc.created_at,
        user_name: currentDocUser?.name || 'Unknown User',
        user_id: currentDoc.uploaded_by,
        details: `Document "${currentDoc.name}" was uploaded`,
        version: 1,
        metadata: {
          file_name: currentDoc.name
        }
      });

      // Add version history entries
      versions?.forEach((version) => {
        const versionUser = versionUsers?.find(u => u.user_id === version.uploaded_by);
        historyItems.push({
          id: `version-${version.id}`,
          type: 'version_created',
          timestamp: version.created_at,
          user_name: versionUser?.name || 'Unknown User',
          user_id: version.uploaded_by,
          details: version.changes_summary || `Created revision ${String.fromCharCode(64 + version.version_number)}`,
          version: version.version_number,
          metadata: {
            file_path: version.file_path,
            file_name: currentDoc.name,
            changes_summary: version.changes_summary,
            version_number: version.version_number
          }
        });
      });

      // Add activity log entries
      activities?.forEach((activity) => {
        const activityUser = activityUsers?.find(u => u.user_id === activity.user_id);
        historyItems.push({
          id: activity.id,
          type: activity.action as DocumentHistoryItem['type'],
          timestamp: activity.created_at,
          user_name: activityUser?.name || 'Unknown User',
          user_id: activity.user_id,
          details: activity.description,
          metadata: (activity.metadata as any) || {}
        });
      });

      // Sort by timestamp (newest first)
      historyItems.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return historyItems;
    } catch (error: any) {
      console.error('Error fetching document history:', error);
      toast({
        title: "Error",
        description: "Failed to load document history",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getDocumentRevisions = useCallback(async (documentId: string): Promise<DocumentRevision[]> => {
    try {
      setLoading(true);

      // Get current document
      const { data: currentDoc, error: docError } = await supabase
        .from('documents')
        .select(`
          id,
          name,
          file_path,
          file_size,
          uploaded_by,
          version,
          created_at
        `)
        .eq('id', documentId)
        .maybeSingle();

      if (!currentDoc) {
        throw new Error('Document not found');
      }

      if (docError) throw docError;

      // Get current document user
      const { data: currentDocUser } = await supabase
        .from('profiles')
        .select('user_id, name')
        .eq('user_id', currentDoc.uploaded_by)
        .maybeSingle();

      // Get all versions
      const { data: versions, error: versionsError } = await supabase
        .from('document_versions')
        .select(`
          id,
          version_number,
          file_path,
          changes_summary,
          created_at,
          uploaded_by
        `)
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (versionsError) throw versionsError;

      // Get user names for versions
      const versionUserIds = versions?.map(v => v.uploaded_by) || [];
      const { data: versionUsers } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', versionUserIds);

      const revisions: DocumentRevision[] = [];

      // Add current version
      if (currentDoc) {
        revisions.push({
          id: currentDoc.id,
          document_id: documentId,
          version_number: currentDoc.version || 1,
          file_path: currentDoc.file_path,
          file_name: currentDoc.name,
          file_size: currentDoc.file_size,
          uploaded_by: currentDoc.uploaded_by,
          uploaded_by_name: currentDocUser?.name || 'Unknown User',
          created_at: currentDoc.created_at,
          is_current: true
        });
      }

      // Add historical versions
      versions?.forEach((version) => {
        const versionUser = versionUsers?.find(u => u.user_id === version.uploaded_by);
        revisions.push({
          id: version.id,
          document_id: documentId,
          version_number: version.version_number,
          file_path: version.file_path,
          file_name: currentDoc.name,
          uploaded_by: version.uploaded_by,
          uploaded_by_name: versionUser?.name || 'Unknown User',
          changes_summary: version.changes_summary,
          created_at: version.created_at,
          is_current: false
        });
      });

      // Sort by version number (newest first)
      revisions.sort((a, b) => b.version_number - a.version_number);

      return revisions;
    } catch (error: any) {
      console.error('Error fetching document revisions:', error);
      toast({
        title: "Error",
        description: "Failed to load document revisions",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    getDocumentHistory,
    getDocumentRevisions,
    loading
  };
};
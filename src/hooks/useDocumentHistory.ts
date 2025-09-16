import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityEntry {
  id: string;
  type: 'created' | 'viewed' | 'edited' | 'downloaded' | 'shared' | 'version_created' | 'superseded' | 'archived' | 'reverted';
  user_id: string;
  user_name?: string;
  timestamp: string;
  details?: string;
  version?: number;
  metadata?: any;
}

interface UseDocumentHistoryReturn {
  getDocumentHistory: (documentId: string) => Promise<ActivityEntry[]>;
  logActivity: (documentId: string, action: string, details?: string, metadata?: any) => Promise<void>;
  getSupersededDocuments: (projectId: string) => Promise<any[]>;
  loading: boolean;
}

export const useDocumentHistory = (): UseDocumentHistoryReturn => {
  const [loading, setLoading] = useState(false);

  const getDocumentHistory = useCallback(async (documentId: string): Promise<ActivityEntry[]> => {
    setLoading(true);
    try {
      const activities: ActivityEntry[] = [];

      // Get document creation and general activities from activity_log
      const { data: activityLogs } = await supabase
        .from('activity_log')
        .select(`
          id,
          action,
          user_id,
          created_at,
          description,
          metadata
        `)
        .eq('entity_id', documentId)
        .eq('entity_type', 'document')
        .order('created_at', { ascending: false });

      // Get document versions with file paths
      const { data: versions } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      // Get document events
      const { data: events } = await supabase
        .from('document_events')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      // Get document shares
      const { data: shares } = await supabase
        .from('document_shares')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });

      // Get document transmittals
      const { data: transmittals } = await supabase
        .from('document_transmittals')
        .select('*')
        .eq('document_id', documentId)
        .order('sent_at', { ascending: false });

      // Get user profiles for all involved users
      const allUserIds = [
        ...(activityLogs?.map(log => log.user_id) || []),
        ...(versions?.map(version => version.uploaded_by) || []),
        ...(events?.map(event => event.user_id).filter(Boolean) || []),
        ...(shares?.map(share => share.shared_by) || []),
        ...(transmittals?.map(t => t.sent_by).filter(Boolean) || [])
      ];
      const uniqueUserIds = [...new Set(allUserIds)];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name')
        .in('user_id', uniqueUserIds);

      const getUserName = (userId: string) => {
        const profile = profiles?.find(p => p.user_id === userId);
        return profile?.name || 'Unknown User';
      };

      // Process activity logs
      activityLogs?.forEach(log => {
        const metadata = typeof log.metadata === 'object' && log.metadata !== null && !Array.isArray(log.metadata) 
          ? log.metadata as Record<string, any>
          : {};
        
        activities.push({
          id: log.id,
          type: log.action as any,
          user_id: log.user_id,
          user_name: getUserName(log.user_id),
          timestamp: log.created_at,
          details: log.description,
          metadata: metadata,
          version: typeof metadata.version === 'number' ? metadata.version : undefined
        });
      });

      // Process versions with file names
      versions?.forEach(version => {
        const fileName = version.file_path?.split('/').pop() || `Version ${String.fromCharCode(64 + version.version_number)}`;
        activities.push({
          id: `version-${version.id}`,
          type: 'version_created',
          user_id: version.uploaded_by,
          user_name: getUserName(version.uploaded_by),
          timestamp: version.created_at,
          details: `Document superseded by ${fileName}${version.changes_summary ? ` - ${version.changes_summary}` : ''}`,
          version: version.version_number,
          metadata: { file_path: version.file_path, file_name: fileName }
        });
      });

      // Process document events
      events?.forEach(event => {
        if (event.user_id) {
          activities.push({
            id: `event-${event.id}`,
            type: event.event_type as any,
            user_id: event.user_id,
            user_name: getUserName(event.user_id),
            timestamp: event.created_at || new Date().toISOString(),
            details: event.event_description,
            metadata: event.metadata
          });
        }
      });

      // Process document shares
      shares?.forEach(share => {
        const sharedWithName = getUserName(share.shared_with);
        activities.push({
          id: `share-${share.id}`,
          type: 'shared',
          user_id: share.shared_by,
          user_name: getUserName(share.shared_by),
          timestamp: share.created_at,
          details: `Shared with: ${sharedWithName} (${share.permission_level} access)${share.expires_at ? ` - Expires: ${new Date(share.expires_at).toLocaleDateString()}` : ''}`,
          metadata: { 
            shared_with: sharedWithName, 
            permission_level: share.permission_level,
            expires_at: share.expires_at
          }
        });
      });

      // Process transmittals
      transmittals?.forEach(transmittal => {
        activities.push({
          id: `transmittal-${transmittal.id}`,
          type: 'transmitted' as any,
          user_id: transmittal.sent_by || '',
          user_name: transmittal.sent_by ? getUserName(transmittal.sent_by) : 'System',
          timestamp: transmittal.sent_at || transmittal.created_at || new Date().toISOString(),
          details: `Document transmitted to ${transmittal.sent_to}${transmittal.purpose ? ` for ${transmittal.purpose}` : ''}${transmittal.notes ? ` - ${transmittal.notes}` : ''}`,
          metadata: {
            transmittal_number: transmittal.transmittal_number,
            sent_to: transmittal.sent_to,
            purpose: transmittal.purpose
          }
        });
      });

      // Sort by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return activities;
    } catch (error) {
      console.error('Error fetching document history:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const logActivity = useCallback(async (
    documentId: string, 
    action: string, 
    details?: string, 
    metadata?: any
  ): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get project ID for the document
      const { data: document } = await supabase
        .from('documents')
        .select('project_id')
        .eq('id', documentId)
        .single();

      await supabase
        .from('activity_log')
        .insert({
          user_id: user.id,
          project_id: document?.project_id,
          entity_type: 'document',
          entity_id: documentId,
          action,
          description: details || action,
          metadata: metadata || {}
        });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }, []);

  const getSupersededDocuments = useCallback(async (projectId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          superseded_by_document:documents!documents_superseded_by_fkey(
            id,
            title,
            name,
            version
          )
        `)
        .eq('project_id', projectId)
        .eq('is_superseded', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching superseded documents:', error);
      return [];
    }
  }, []);

  return {
    getDocumentHistory,
    logActivity,
    getSupersededDocuments,
    loading
  };
};
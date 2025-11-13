import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { 
  getFileExtension, 
  getMimeType,
  getSafeMime,
  getSafeFilename,
  getFileCategory, 
  generateStorageFilename,
  formatFileSize
} from '@/utils/documentUtils';

export interface Document {
  id: string;
  project_id: string;
  name: string;
  file_path: string;
  file_type: string;
  file_size?: number;
  file_extension?: string;
  category?: string;
  tags?: string[];
  uploaded_by: string;
  visibility_scope?: string;
  status: 'For Tender' | 'For Information' | 'For Construction';
  version?: number;
  created_at: string;
  updated_at: string;
  document_number?: string;
  title?: string;
  assigned_to?: string;
  is_locked?: boolean;
  locked_by?: string;
  locked_at?: string;
  superseded_by?: string;
  is_superseded?: boolean;
  file_type_category?: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_path: string;
  uploaded_by: string;
  changes_summary?: string;
  created_at: string;
}

export interface DocumentApproval {
  id: string;
  document_id: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_date?: string;
  created_at: string;
}

export const useDocuments = (projectId?: string) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDocuments = async (filterProjectId?: string) => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setDocuments([]);
        setLoading(false);
        return;
      }

      // Only fetch documents for specified project and ensure user permissions
      if (!filterProjectId && !projectId) {
        setDocuments([]);
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
        .single();

      if (!membership) {
        // User is not a member of this project
        setDocuments([]);
        setLoading(false);
        return;
      }

      // Build query for documents where user is either:
      // 1. Creator of the document
      // 2. Document has been shared with them
      // 3. Document visibility is 'project' (visible to all project members)
      let query = supabase
        .from('documents')
        .select('*')
        .eq('is_superseded', false) // Only show latest revisions
        .eq('project_id', targetProjectId)
        .or(`uploaded_by.eq.${user.id},visibility_scope.eq.project`)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Documents fetch error:', error);
        throw error;
      }

      let filteredData = data || [];

      // Additional check for shared documents if user is not the creator
      if (filteredData.length > 0) {
        const nonOwnedDocs = filteredData.filter(doc => doc.uploaded_by !== user.id);
        
        if (nonOwnedDocs.length > 0) {
          // Check for shared documents
          const { data: sharedDocs } = await supabase
            .from('document_shares')
            .select('document_id')
            .eq('shared_with', user.id);

          const sharedDocIds = new Set(sharedDocs?.map(share => share.document_id) || []);
          
          // Filter out private documents that aren't shared with the user
          filteredData = filteredData.filter(doc => 
            doc.uploaded_by === user.id || 
            doc.visibility_scope === 'project' ||
            sharedDocIds.has(doc.id)
          );
        }
      }
      
      setDocuments(filteredData);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error fetching documents",
        description: error.message || "Failed to load documents. Please try again.",
        variant: "destructive"
      });
      setDocuments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const createNewVersion = async (
    documentId: string,
    file: File,
    changesSummary?: string
  ): Promise<DocumentVersion | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get current document to get project_id and current version
      const { data: currentDoc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError) throw docError;

      const nextVersion = (currentDoc.version || 1) + 1;

      // Upload new version file
      const fileExt = (file.name.split('.').pop() || 'bin').toLowerCase();
      const fileName = `${Date.now()}-v${nextVersion}.${fileExt}`;
      const filePath = `${currentDoc.project_id}/versions/${fileName}`;

      // Resolve MIME type for the new version
      const extensionToMime: Record<string, string> = {
        pdf: 'application/pdf',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        bmp: 'image/bmp',
        svg: 'image/svg+xml',
        txt: 'text/plain',
        csv: 'text/csv',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        zip: 'application/zip',
        rar: 'application/vnd.rar',
        sevenz: 'application/x-7z-compressed',
        heic: 'image/heic',
      };
      const isGeneric = !file.type || file.type === 'application/octet-stream' || file.type === 'binary/octet-stream';
      const resolvedMime = isGeneric ? (extensionToMime[fileExt] || 'application/octet-stream') : file.type;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { contentType: resolvedMime });

      if (uploadError) throw uploadError;

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

      // Update document's current version and file metadata
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          version: nextVersion,
          file_path: filePath,
          file_type: resolvedMime,
          file_extension: fileExt,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Version ${nextVersion} created successfully`,
      });

      await fetchDocuments();
      return versionData;
    } catch (error) {
      console.error('Error creating new version:', error);
      toast({
        title: "Error",
        description: "Failed to create new version",
        variant: "destructive",
      });
      return null;
    }
  };

  const toggleDocumentLock = async (documentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const document = documents.find(d => d.id === documentId);
      if (!document) throw new Error('Document not found');

      const newLockState = !document.is_locked;
      
      const updateData = {
        is_locked: newLockState,
        locked_by: newLockState ? user.id : null,
        locked_at: newLockState ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Document ${newLockState ? 'locked' : 'unlocked'} successfully`,
      });

      await fetchDocuments(projectId);
    } catch (error) {
      console.error('Error toggling document lock:', error);
      toast({
        title: "Error",
        description: "Failed to toggle document lock",
        variant: "destructive",
      });
    }
  };

  const uploadDocument = async (
    file: File,
    projectId: string,
    name?: string,
    metadata?: {
      documentNumber?: string;
      status: 'For Tender' | 'For Information' | 'For Construction';
      fileType: string;
      isPrivate?: boolean;
    }
  ): Promise<Document | null> => {
    try {
      // Validate inputs
      if (!file) {
        throw new Error('No file provided');
      }
      
      if (!projectId) {
        throw new Error('No project ID provided');
      }

      console.log('🔍 Upload started with file:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });

      // ✅ BULLETPROOF MIME AND EXTENSION DETECTION
      const originalName = file.name || 'unnamed.bin';
      let extension = getFileExtension(originalName);
      let safeMime = file.type && file.type !== 'application/octet-stream' && file.type !== 'binary/octet-stream' 
        ? file.type 
        : getMimeType(extension);
      
      // Special handling for files without extensions (common for screenshots)
      if (extension === 'bin' && file.type && file.type.startsWith('image/')) {
        // Browser detected image type, infer extension from MIME
        const typeMap: Record<string, string> = {
          'image/png': 'png',
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/gif': 'gif',
          'image/webp': 'webp',
          'image/bmp': 'bmp'
        };
        extension = typeMap[file.type] || 'png'; // default to png for unknown image types
        safeMime = file.type;
      }
      
      console.log('🔒 File upload debug:', { 
        originalName, 
        extension, 
        safeMime, 
        browserType: file.type,
        extensionInferred: extension !== getFileExtension(originalName)
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check for existing document with same document number for replacement logic
      let existingDocument = null;
      if (metadata?.documentNumber) {
        const { data: existing } = await supabase
          .from('documents')
          .select('*')
          .eq('project_id', projectId)
          .eq('document_number', metadata.documentNumber)
          .eq('is_superseded', false)
          .single();
        
        existingDocument = existing;
      }

      const filePath = `${projectId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
      
      console.log('Generated file path with correct extension:', filePath);

      console.log('Generated file path:', filePath);

      // MIME type already forced via getMimeType(extension)

      // ✅ UPLOAD WITH FORCED CONTENT-TYPE
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, { contentType: safeMime, cacheControl: '3600' });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded to storage successfully');

      // Determine version number
      const newVersion = existingDocument ? (existingDocument.version || 1) + 1 : 1;

      const documentData = {
        project_id: projectId,
        name: originalName,
        title: name || originalName.replace(/\.[^/.]+$/, ''),
        file_path: filePath,
        file_type: safeMime, // Using forced MIME type from extension
        file_size: file.size,
        file_extension: extension,
        category: getFileCategory(extension),
        tags: [],
        uploaded_by: user.id,
        status: metadata?.status || 'For Information' as const,
        document_number: metadata?.documentNumber || null,
        file_type_category: metadata?.fileType || 'Architectural',
        version: newVersion,
        visibility_scope: metadata?.isPrivate ? 'private' : 'project'
      };

      console.log('Creating document record with MIME type:', {
        ...documentData,
        originalFileType: file.type,
        forcedFileType: safeMime,
        extension: extension
      });

      const { data, error } = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      // If replacing an existing document, mark it as superseded
      if (existingDocument) {
        await supabase
          .from('documents')
          .update({
            is_superseded: true,
            superseded_by: data.id
          })
          .eq('id', existingDocument.id);
      }

      console.log('✅ Document record created successfully with correct MIME type:', {
        id: data.id,
        name: data.name,
        file_type: data.file_type,
        file_extension: data.file_extension
      });

      // Log activity for document upload
      await supabase
        .from('activity_log')
        .insert([{
          user_id: user.id,
          project_id: projectId,
          entity_type: 'document',
          entity_id: data.id,
          action: 'uploaded',
          description: `Uploaded document: "${originalName}"`,
          metadata: { 
            file_type: safeMime,
            file_size: file.size,
            category: 'general',
            status: metadata?.status,
            document_number: metadata?.documentNumber
          }
        }]);

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      await fetchDocuments(projectId);
      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
      return null;
    }
  };

  // Use the imported utility function
  // (removed local implementation)

  const updateDocumentStatus = async (
    documentId: string,
    status: Document['status']
  ) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document status updated successfully",
      });

      await fetchDocuments(projectId);
    } catch (error) {
      console.error('Error updating document status:', error);
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive",
      });
    }
  };

  const deleteDocument = async (documentId: string, filePath: string) => {
    try {
      // Get all versions of this document
      const { data: versions } = await supabase
        .from('document_versions')
        .select('file_path')
        .eq('document_id', documentId);

      // Delete all version files from storage
      if (versions && versions.length > 0) {
        const versionFilePaths = versions.map(v => v.file_path);
        const { error: versionStorageError } = await supabase.storage
          .from('documents')
          .remove(versionFilePaths);

        if (versionStorageError) {
          console.warn('Some version files could not be deleted:', versionStorageError);
        }
      }

      // Delete current document file from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) {
        console.warn('Document file could not be deleted:', storageError);
      }

      // Delete all document versions from database
      const { error: versionsError } = await supabase
        .from('document_versions')
        .delete()
        .eq('document_id', documentId);

      if (versionsError) {
        console.warn('Error deleting versions:', versionsError);
      }

      // Delete document shares
      const { error: sharesError } = await supabase
        .from('document_shares')
        .delete()
        .eq('document_id', documentId);

      if (sharesError) {
        console.warn('Error deleting shares:', sharesError);
      }

      // Delete document events/history
      const { error: eventsError } = await supabase
        .from('document_events')
        .delete()
        .eq('document_id', documentId);

      if (eventsError) {
        console.warn('Error deleting events:', eventsError);
      }

      // Finally, delete the main document record
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast({
        title: "Document Deleted",
        description: "Document and all versions have been permanently deleted",
      });

      await fetchDocuments(projectId);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document completely",
        variant: "destructive",
      });
    }
  };

  // ✅ BULLETPROOF DOWNLOAD WITH SIGNED URL AND CORRECT FILENAME
  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      console.log('[DownloadDocument] Starting download:', { filePath, fileName });
      
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 60);

      if (error) {
        console.error('[Download Error]', error);
        throw new Error(`Failed to create download URL: ${error.message}`);
      }

      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      // ✅ Ensure correct filename with extension
      const safeName = fileName.includes('.') ? fileName : `${fileName}.bin`;
      
      const a = document.createElement('a');
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();

      console.log('[DownloadDocument] Download completed:', safeName);

      // Log the download activity
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('activity_log')
          .insert([{
            user_id: user.id,
            entity_type: 'document',
            action: 'downloaded',
            description: `Downloaded document: "${fileName}"`,
            metadata: { 
              file_path: filePath,
              file_name: fileName
            }
          }]);
      }
    } catch (error) {
      console.error('[DownloadDocument Error]', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown download error';
      toast({
        title: "Download Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const getDocumentVersions = async (documentId: string): Promise<DocumentVersion[]> => {
    try {
      const { data, error } = await supabase
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching document versions:', error);
      return [];
    }
  };

  const requestApproval = async (documentId: string, approverId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('document_approvals')
        .insert({
          document_id: documentId,
          approver_id: approverId,
          status: 'pending'
        });

      if (error) throw error;

      // Update document status
      await updateDocumentStatus(documentId, 'For Information');

      toast({
        title: "Success",
        description: "Approval request sent successfully",
      });
    } catch (error) {
      console.error('Error requesting approval:', error);
      toast({
        title: "Error",
        description: "Failed to request approval",
        variant: "destructive",
      });
    }
  };

  const updateDocumentType = async (documentId: string, type: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ category: type })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document type updated successfully",
      });

      await fetchDocuments(projectId);
    } catch (error) {
      console.error('Error updating document type:', error);
      toast({
        title: "Error",
        description: "Failed to update document type",
        variant: "destructive",
      });
    }
  };

  const updateDocumentAssignment = async (documentId: string, assignedTo: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ assigned_to: assignedTo || null })
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document assignment updated successfully",
      });

      await fetchDocuments(projectId);
    } catch (error) {
      console.error('Error updating document assignment:', error);
      toast({
        title: "Error",
        description: "Failed to update document assignment",
        variant: "destructive",
      });
    }
  };

  const approveDocument = async (
    approvalId: string,
    documentId: string,
    approved: boolean,
    comments?: string
  ) => {
    try {
      const status = approved ? 'approved' : 'rejected';
      
      // Update approval record
      const { error: approvalError } = await supabase
        .from('document_approvals')
        .update({
          status,
          comments,
          approved_date: new Date().toISOString()
        })
        .eq('id', approvalId);

      if (approvalError) throw approvalError;

      // Update document status
      await updateDocumentStatus(documentId, approved ? 'For Construction' : 'For Information');

      toast({
        title: "Success",
        description: `Document ${approved ? 'approved' : 'rejected'} successfully`,
      });
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: "Error",
        description: "Failed to process approval",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDocuments(projectId);
  }, [projectId]);

  const revertToVersion = async (documentId: string, versionId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get the version to revert to
      const { data: version, error: versionError } = await supabase
        .from('document_versions')
        .select('*')
        .eq('id', versionId)
        .single();

      if (versionError) throw versionError;

      // Update document to use this version
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          version: version.version_number,
          file_path: version.file_path,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Reverted to version ${version.version_number}`,
      });

      await fetchDocuments();
    } catch (error) {
      console.error('Error reverting to version:', error);
      toast({
        title: "Error",
        description: "Failed to revert to version",
        variant: "destructive",
      });
    }
  };

  const supersedeDocument = async (documentId: string, newFile: File, changesSummary?: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get the current document
      const { data: currentDoc, error: docError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError) throw docError;

      // First, archive the current version
      const { error: archiveError } = await supabase
        .from('document_versions')
        .insert({
          document_id: documentId,
          version_number: currentDoc.version || 1,
          file_path: currentDoc.file_path,
          uploaded_by: currentDoc.uploaded_by,
          changes_summary: 'Archived before superseding'
        });

      if (archiveError) throw archiveError;

      // Upload the new file that will supersede the current one
      const fileExtension = getFileExtension(newFile.name);
      const newFilePath = `${currentDoc.project_id}/${Date.now()}-superseded-${Math.random().toString(36).slice(2)}.${fileExtension}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(newFilePath, newFile);

      if (uploadError) throw uploadError;

      // Create the new document
      const newDocumentData = {
        project_id: currentDoc.project_id,
        name: newFile.name,
        title: currentDoc.title,
        file_path: newFilePath,
        file_type: getMimeType(fileExtension),
        file_size: newFile.size,
        file_extension: fileExtension,
        category: currentDoc.category,
        tags: currentDoc.tags,
        uploaded_by: user.id,
        status: currentDoc.status,
        document_number: currentDoc.document_number,
        file_type_category: currentDoc.file_type_category,
        version: (currentDoc.version || 1) + 1,
        visibility_scope: currentDoc.visibility_scope
      };

      const { data: newDocument, error: insertError } = await supabase
        .from('documents')
        .insert(newDocumentData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Mark the old document as superseded
      await supabase
        .from('documents')
        .update({
          is_superseded: true,
          superseded_by: newDocument.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      // Log the supersede activity
      await supabase
        .from('activity_log')
        .insert({
          user_id: user.id,
          project_id: currentDoc.project_id,
          entity_type: 'document',
          entity_id: documentId,
          action: 'superseded',
          description: `Document superseded by new version${changesSummary ? `: ${changesSummary}` : ''}`,
          metadata: {
            superseded_by: newDocument.id,
            new_version: newDocument.version,
            changes_summary: changesSummary
          }
        });

      // Log the creation of new document
      await supabase
        .from('activity_log')
        .insert({
          user_id: user.id,
          project_id: currentDoc.project_id,
          entity_type: 'document',
          entity_id: newDocument.id,
          action: 'created',
          description: `Document created (superseding previous version)`,
          metadata: {
            supersedes: documentId,
            version: newDocument.version
          }
        });

      toast({
        title: "Success",
        description: "Document successfully superseded",
      });

      await fetchDocuments();
      return true;
    } catch (error) {
      console.error('Error superseding document:', error);
      toast({
        title: "Error", 
        description: "Failed to supersede document",
        variant: "destructive",
      });
      return false;
    }
  };

  // Set up real-time subscriptions for instant updates
  useEffect(() => {
    if (!projectId) return;

    const channels = [];

    // Subscribe to document changes
    const documentsChannel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Document change detected:', payload);
          fetchDocuments(projectId);
        }
      )
      .subscribe();

    channels.push(documentsChannel);

    // Subscribe to document groups changes (for new document system)
    const documentGroupsChannel = supabase
      .channel('document-groups-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_groups',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Document group change detected:', payload);
          fetchDocuments(projectId);
        }
      )
      .subscribe();

    channels.push(documentGroupsChannel);

    // Subscribe to document versions changes
    const documentVersionsChannel = supabase
      .channel('document-versions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_versions',
        },
        (payload) => {
          console.log('Document version change detected:', payload);
          fetchDocuments(projectId);
        }
      )
      .subscribe();

    channels.push(documentVersionsChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [projectId]);

  // Initial data load
  useEffect(() => {
    if (projectId) {
      fetchDocuments(projectId);
    }
  }, [projectId]);

  return {
    documents,
    loading,
    fetchDocuments,
    uploadDocument,
    createNewVersion,
    updateDocumentStatus,
    updateDocumentType,
    updateDocumentAssignment,
    deleteDocument,
    downloadDocument,
    getDocumentVersions,
    revertToVersion,
    requestApproval,
    approveDocument,
    toggleDocumentLock,
    supersedeDocument
  };

  // Set up comprehensive real-time subscriptions for instant updates
  useEffect(() => {
    if (!projectId) return;

    const channels = [];

    // Subscribe to documents table changes
    const documentsChannel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Document change detected:', payload);
          fetchDocuments();
        }
      )
      .subscribe();

    channels.push(documentsChannel);

    // Subscribe to document_groups table changes
    const documentGroupsChannel = supabase
      .channel('document-groups-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_groups',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          console.log('Document group change detected:', payload);
          fetchDocuments();
        }
      )
      .subscribe();

    channels.push(documentGroupsChannel);

    // Subscribe to document_revisions table changes
    const documentRevisionsChannel = supabase
      .channel('document-revisions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_revisions',
        },
        (payload) => {
          console.log('Document revision change detected:', payload);
          fetchDocuments();
        }
      )
      .subscribe();

    channels.push(documentRevisionsChannel);

    // Subscribe to document_shares changes for shared documents
    const documentSharesChannel = supabase
      .channel('document-shares-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_shares',
        },
        (payload) => {
          console.log('Document share change detected:', payload);
          fetchDocuments();
        }
      )
      .subscribe();

    channels.push(documentSharesChannel);

    // Subscribe to document_approvals changes
    const documentApprovalsChannel = supabase
      .channel('document-approvals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_approvals',
        },
        (payload) => {
          console.log('Document approval change detected:', payload);
          fetchDocuments();
        }
      )
      .subscribe();

    channels.push(documentApprovalsChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [projectId]);

  // Listen to global real-time events for instant updates
  useEffect(() => {
    const handleDocumentChange = () => {
      console.log('[useDocuments] Document change detected, refetching...');
      fetchDocuments(projectId);
    };

    window.addEventListener('supabase:documents:change', handleDocumentChange);
    window.addEventListener('supabase:document_groups:change', handleDocumentChange);
    window.addEventListener('supabase:document_revisions:change', handleDocumentChange);

    return () => {
      window.removeEventListener('supabase:documents:change', handleDocumentChange);
      window.removeEventListener('supabase:document_groups:change', handleDocumentChange);
      window.removeEventListener('supabase:document_revisions:change', handleDocumentChange);
    };
  }, [projectId]);
};
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterProjectId || projectId) {
        query = query.eq('project_id', filterProjectId || projectId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Documents fetch error:', error);
        throw error;
      }
      
      // Filter out private documents that don't belong to the current user
      const { data: { user } } = await supabase.auth.getUser();
      const filteredData = data?.filter(doc => 
        doc.visibility_scope !== 'private' || doc.uploaded_by === user?.id
      ) || [];
      
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
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      await fetchDocuments(projectId);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
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
    toggleDocumentLock
  };
};
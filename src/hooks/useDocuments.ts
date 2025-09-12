import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      
      setDocuments(data || []);
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
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-v${nextVersion}.${fileExt}`;
      const filePath = `${currentDoc.project_id}/versions/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

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

      // Update document's current version and file path
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          version: nextVersion,
          file_path: filePath,
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

      // Validate file properties
      const fileName = file.name || 'unnamed-file';
      const fileType = file.type || 'application/octet-stream';
      const fileSize = file.size || 0;

      console.log('Uploading file:', { fileName, fileType, fileSize, projectId });

      // Get current user
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

      // Generate file path with proper extension handling
      let fileExt = 'bin'; // Default extension
      if (fileName && fileName.includes('.')) {
        const parts = fileName.split('.');
        fileExt = parts.pop() || 'bin';
      }
      
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      const generatedFileName = `${timestamp}-${randomId}.${fileExt}`;
      const filePath = `${projectId}/${generatedFileName}`;

      console.log('Generated file path:', filePath);

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      console.log('File uploaded to storage successfully');

      // Determine version number
      const newVersion = existingDocument ? (existingDocument.version || 1) + 1 : 1;

      // Create document record with new fields
      const documentData = {
        project_id: projectId,
        name: name || fileName,
        title: name || fileName,
        file_path: filePath,
        file_type: fileType,
        file_size: fileSize,
        file_extension: fileExt,
        category: getFileTypeCategory(fileExt),
        tags: [],
        uploaded_by: user.id,
        status: metadata?.status || 'For Information' as const,
        document_number: metadata?.documentNumber || null,
        file_type_category: metadata?.fileType || 'Architectural',
        version: newVersion
      };

      console.log('Creating document record:', documentData);

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

      console.log('Document record created successfully:', data);

      // Log activity for document upload
      await supabase
        .from('activity_log')
        .insert([{
          user_id: user.id,
          project_id: projectId,
          entity_type: 'document',
          entity_id: data.id,
          action: 'uploaded',
          description: `Uploaded document: "${name || fileName}"`,
          metadata: { 
            file_type: fileType,
            file_size: fileSize,
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

  const getFileTypeCategory = (fileExtension: string): string => {
    const ext = fileExtension.toLowerCase();
    const typeMap: { [key: string]: string } = {
      'pdf': 'contracts',
      'doc': 'specifications',
      'docx': 'specifications',
      'dwg': 'architectural_drawings',
      'dxf': 'architectural_drawings',
      'jpg': 'photographs',
      'jpeg': 'photographs',
      'png': 'photographs',
      'gif': 'photographs',
      'xlsx': 'reports',
      'xls': 'reports',
      'txt': 'correspondence',
      'zip': 'permits',
      'rar': 'permits'
    };
    return typeMap[ext] || 'general';
  };

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

  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      // Create download link
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
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
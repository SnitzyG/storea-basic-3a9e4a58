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
  uploaded_by: string;
  visibility_scope?: string;
  status: 'draft' | 'under_review' | 'approved' | 'rejected';
  version?: number;
  created_at: string;
  updated_at: string;
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

      if (filterProjectId) {
        query = query.eq('project_id', filterProjectId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadDocument = async (
    file: File,
    projectId: string,
    name?: string
  ): Promise<Document | null> => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Generate file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${projectId}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert({
          project_id: projectId,
          name: name || file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          uploaded_by: user.id,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

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
      await updateDocumentStatus(documentId, 'under_review');

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
      await updateDocumentStatus(documentId, approved ? 'approved' : 'rejected');

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

  return {
    documents,
    loading,
    fetchDocuments,
    uploadDocument,
    updateDocumentStatus,
    deleteDocument,
    downloadDocument,
    getDocumentVersions,
    requestApproval,
    approveDocument
  };
};
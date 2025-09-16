import React, { useState, useMemo, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocumentGroups, DocumentGroup } from '@/hooks/useDocumentGroups';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { DocumentDetailsDialog } from '@/components/documents/DocumentDetailsDialog';
import { DocumentFilters } from '@/components/documents/DocumentFilters';
import { DocumentListView } from '@/components/documents/DocumentListView';
import { DocumentActivity } from '@/components/documents/DocumentActivity';
import { supabase } from '@/integrations/supabase/client';
const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentGroup | null>(null);
  const [detailsDocument, setDetailsDocument] = useState<DocumentGroup | null>(null);
  const [activityDocument, setActivityDocument] = useState<DocumentGroup | null>(null);
  const {
    profile
  } = useAuth();
  const {
    projects
  } = useProjects();
  const location = useLocation();
  const {
    documentGroups: documents,
    loading,
    fetchDocumentGroups,
    createDocumentGroup,
    supersedeDocument,
    deleteDocumentGroup
  } = useDocumentGroups(selectedProject === 'all' ? undefined : selectedProject);
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Enhanced search - search in title, category, document number
      const searchFields = [
        doc.title,
        doc.category,
        doc.document_number,
        `rev ${doc.current_revision?.revision_number || 1}` // Include revision number
      ].filter(Boolean).join(' ').toLowerCase();
      
      const matchesSearch = searchTerm === '' || searchFields.includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [documents, searchTerm, selectedCategory, statusFilter]);
  const canEditDocument = (document: any) => {
    return document.created_by === profile?.user_id;
  };
  const canApproveDocument = () => {
    return profile?.role === 'architect';
  };
  const handleDownload = async (groupId: string) => {
    const group = documents.find(d => d.id === groupId);
    if (!group?.current_revision?.file_path) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(group.current_revision.file_path, 60 * 60); // 1 hour
      
      if (error || !data?.signedUrl) {
        const { data: pub } = supabase.storage
          .from('documents')
          .getPublicUrl(group.current_revision.file_path);
        
        const link = window.document.createElement('a');
        link.href = pub.publicUrl;
        link.download = group.current_revision.file_name || 'document';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else {
        const link = window.document.createElement('a');
        link.href = data.signedUrl;
        link.download = group.current_revision.file_name || 'document';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleStatusChange = async (groupId: string, status: string) => {
    // Implementation for status change would go here
    console.log('Status change:', groupId, status);
  };

  const handleTypeChange = async (groupId: string, type: string) => {
    // Implementation for type change would go here
    console.log('Type change:', groupId, type);
  };
  const getStatusCounts = () => {
    const counts = {
      all: documents.length,
      'For Tender': 0,
      'For Information': 0,
      'For Construction': 0
    };
    documents.forEach(doc => {
      if (doc.status in counts) {
        (counts as any)[doc.status]++;
      }
    });
    return counts;
  };
  const statusCounts = getStatusCounts();

  // Auto-open upload dialog when navigated with state
  useEffect(() => {
    if ((location.state as any)?.openUpload) {
      setUploadDialogOpen(true);
      // Clear the flag to prevent reopening on internal state changes
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Fetch document groups on mount and when project changes
  useEffect(() => {
    fetchDocumentGroups();
  }, [fetchDocumentGroups, selectedProject]);
  if (loading) {
    return <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Documents</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>;
  }
  return <div className="space-y-6 mx-[25px]">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-muted-foreground">
            Professional document control and collaboration system
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Documents</DialogTitle>
              </DialogHeader>
              {projects.length > 0 ? <DocumentUpload projectId={selectedProject === 'all' ? projects[0]?.id : selectedProject} onUploadComplete={() => setUploadDialogOpen(false)} /> : <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No projects available. Create a project first to upload documents.
                  </p>
                </div>}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <DocumentFilters searchTerm={searchTerm} onSearchChange={setSearchTerm} selectedProject={selectedProject} onProjectChange={setSelectedProject} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} selectedStatus={statusFilter} onStatusChange={setStatusFilter} viewMode="list" onViewModeChange={() => {}} projects={projects} documentCounts={{
          total: statusCounts.all,
          'For Tender': statusCounts['For Tender'],
          'For Information': statusCounts['For Information'],
          'For Construction': statusCounts['For Construction']
        }} />
        </CardContent>
      </Card>


      {/* Document List View */}
      {filteredDocuments.length === 0 ? <Card>
          <CardContent className="text-center py-12">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              {documents.length === 0 ? "Upload your first document to get started" : "Try adjusting your filters"}
            </p>
            {documents.length === 0 && <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>}
          </CardContent>
        </Card> : <DocumentListView 
          documentGroups={filteredDocuments} 
          onDownload={handleDownload} 
          onDelete={deleteDocumentGroup} 
          onStatusChange={handleStatusChange} 
          onTypeChange={handleTypeChange} 
          onPreview={setPreviewDocument} 
          onViewDetails={setDetailsDocument} 
          onViewActivity={setActivityDocument} 
          onSupersede={supersedeDocument}
          canEdit={filteredDocuments.some(doc => canEditDocument(doc))} 
          canApprove={canApproveDocument()} 
          selectedProject={selectedProject} 
        />}

      {/* Document Preview Dialog */}
      {previewDocument && <DocumentPreview document={previewDocument} isOpen={!!previewDocument} onClose={() => setPreviewDocument(null)} onDownload={handleDownload} />}

      {/* Document Details Dialog */}
      <DocumentDetailsDialog document={detailsDocument} isOpen={!!detailsDocument} onClose={() => setDetailsDocument(null)} />

      {/* Document Activity Dialog */}
      {activityDocument && (
        <Dialog open={!!activityDocument} onOpenChange={() => setActivityDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Document Activity - {activityDocument.title}</DialogTitle>
            </DialogHeader>
            <DocumentActivity document={activityDocument} />
          </DialogContent>
        </Dialog>
      )}
    </div>;
};
export default Documents;
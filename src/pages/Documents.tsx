import React, { useState, useMemo } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocuments, Document } from '@/hooks/useDocuments';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { DocumentDetailsDialog } from '@/components/documents/DocumentDetailsDialog';
import { DocumentFilters } from '@/components/documents/DocumentFilters';
import { DocumentListView } from '@/components/documents/DocumentListView';

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [detailsDocument, setDetailsDocument] = useState<Document | null>(null);
  const [eventsDocument, setEventsDocument] = useState<Document | null>(null);
  const [transmittalsDocument, setTransmittalsDocument] = useState<Document | null>(null);
  
  const { profile } = useAuth();
  const { projects } = useProjects();
  const { 
    documents, 
    loading, 
    downloadDocument, 
    deleteDocument, 
    updateDocumentStatus,
    updateDocumentType,
    updateDocumentAssignment,
    requestApproval 
  } = useDocuments(selectedProject === 'all' ? undefined : selectedProject);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = (doc.title || doc.name).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [documents, searchTerm, selectedCategory, statusFilter]);

  const canEditDocument = (document: any) => {
    return document.uploaded_by === profile?.user_id;
  };

  const canApproveDocument = () => {
    return profile?.role === 'architect';
  };

  const handleRequestApproval = async (documentId: string) => {
    const document = documents.find(d => d.id === documentId);
    if (!document) return;
    await requestApproval(documentId, profile?.user_id || '');
  };

  const handleStatusChange = async (documentId: string, status: string) => {
    await updateDocumentStatus(documentId, status as Document['status']);
  };

  const handleTypeChange = async (documentId: string, type: string) => {
    await updateDocumentType(documentId, type);
  };

  const handleAssignedToChange = async (documentId: string, assignedTo: string) => {
    await updateDocumentAssignment(documentId, assignedTo);
  };

  const getStatusCounts = () => {
    const counts = {
      all: documents.length,
      draft: 0,
      under_review: 0,
      approved: 0,
      rejected: 0
    };

    documents.forEach(doc => {
      counts[doc.status as keyof typeof counts]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Documents</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
              {projects.length > 0 ? (
                <DocumentUpload
                  projectId={selectedProject === 'all' ? projects[0]?.id : selectedProject}
                  onUploadComplete={() => setUploadDialogOpen(false)}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No projects available. Create a project first to upload documents.
                  </p>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <DocumentFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedProject={selectedProject}
            onProjectChange={setSelectedProject}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedStatus={statusFilter}
            onStatusChange={setStatusFilter}
            viewMode="list"
            onViewModeChange={() => {}}
            projects={projects}
            documentCounts={{
              total: statusCounts.all,
              draft: statusCounts.draft,
              under_review: statusCounts.under_review,
              approved: statusCounts.approved,
              rejected: statusCounts.rejected
            }}
          />
        </CardContent>
      </Card>


      {/* Document List View */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              {documents.length === 0 
                ? "Upload your first document to get started" 
                : "Try adjusting your filters"
              }
            </p>
            {documents.length === 0 && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <DocumentListView
          documents={filteredDocuments}
          onDownload={downloadDocument}
          onDelete={deleteDocument}
          onStatusChange={handleStatusChange}
          onTypeChange={handleTypeChange}
          onAssignedToChange={handleAssignedToChange}
          onPreview={setPreviewDocument}
          onViewDetails={setDetailsDocument}
          onViewEvents={setEventsDocument}
          onViewTransmittals={setTransmittalsDocument}
          canEdit={filteredDocuments.some(doc => canEditDocument(doc))}
          canApprove={canApproveDocument()}
          selectedProject={selectedProject}
        />
      )}

      {/* Document Preview Dialog */}
      {previewDocument && (
        <DocumentPreview
          document={previewDocument}
          isOpen={!!previewDocument}
          onClose={() => setPreviewDocument(null)}
          onDownload={downloadDocument}
        />
      )}

      {/* Document Details Dialog */}
      <DocumentDetailsDialog
        document={detailsDocument}
        isOpen={!!detailsDocument}
        onClose={() => setDetailsDocument(null)}
      />

      {/* TODO: Add Event History Dialog */}
      {/* TODO: Add Transmittal History Dialog */}
    </div>
  );
};

export default Documents;

import React, { useState, useMemo, useEffect } from 'react';
import { Upload, Building, Grid, List, Download } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useDocuments, Document } from '@/hooks/useDocuments';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { DocumentDetailsDialog } from '@/components/documents/DocumentDetailsDialog';
import { DocumentFilters } from '@/components/documents/DocumentFilters';
import { DocumentActivity } from '@/components/documents/DocumentActivity';
import { DocumentListView } from '@/components/documents/DocumentListView';
import { FileTypeIcon } from '@/components/documents/FileTypeIcon';
import { formatFileSize } from '@/utils/documentUtils';

// Professional construction document categories
const CONSTRUCTION_CATEGORIES = [
  { id: 'plans', name: 'Drawings & Plans' },
  { id: 'contracts', name: 'Contracts' },
  { id: 'permits', name: 'Permits & Approvals' },
  { id: 'photos', name: 'Site Photos' },
  { id: 'safety', name: 'Safety Documents' },
  { id: 'specifications', name: 'Specifications' },
  { id: 'correspondence', name: 'Correspondence' },
  { id: 'quality', name: 'Quality Control' },
];

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [detailsDocument, setDetailsDocument] = useState<Document | null>(null);
  const [activityDocument, setActivityDocument] = useState<Document | null>(null);
  
  const { profile } = useAuth();
  const { projects } = useProjects();
  const location = useLocation();
  
  // Get current project from projects (use first available project)
  const currentProject = projects.length > 0 ? projects[0] : null;
  
  const {
    documents,
    loading,
    downloadDocument,
    deleteDocument,
    updateDocumentStatus,
    updateDocumentType,
    updateDocumentAssignment,
    requestApproval,
    toggleDocumentLock
  } = useDocuments(currentProject?.id);

  // Enhanced categories with counts
  const categories = useMemo(() => {
    return CONSTRUCTION_CATEGORIES.map(category => ({
      ...category,
      count: documents.filter(doc => doc.category === category.id).length
    }));
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const title = doc.title || doc.name || '';
      const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase());
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

  const handleStatusChange = async (documentId: string, status: string) => {
    await updateDocumentStatus(documentId, status as Document['status']);
  };

  const handleTypeChange = async (documentId: string, type: string) => {
    await updateDocumentType(documentId, type);
  };

  const handleAssignedToChange = async (documentId: string, assignedTo: string) => {
    await updateDocumentAssignment(documentId, assignedTo);
  };

  // Auto-open upload dialog when navigated with state
  useEffect(() => {
    if ((location.state as any)?.openUpload) {
      setUploadDialogOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  if (!currentProject) {
    return (
      <div className="space-y-6 mx-[25px]">
        <div className="flex flex-col items-center justify-center py-12">
          <Building className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Project Available</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Create a project first to manage documents.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 mx-[25px]">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{currentProject.name} - Documents</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mx-[25px]">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{currentProject.name} - Documents</h1>
          <p className="text-muted-foreground">
            Project document management and collaboration
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        </div>
      </div>

      {/* Category Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {categories.map((category) => (
          <Card 
            key={category.id}
            className={`hover:shadow-md transition-all cursor-pointer hover:border-primary/50 ${
              selectedCategory === category.id ? 'border-primary bg-primary/5' : ''
            }`}
            onClick={() => setSelectedCategory(selectedCategory === category.id ? 'all' : category.id)}
          >
            <CardContent className="p-4 text-center">
              <div className="h-8 w-8 mx-auto mb-2 text-primary">
                <FileTypeIcon fileName={`${category.id}.pdf`} className="h-8 w-8" />
              </div>
              <div className="font-medium text-sm">{category.name}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {category.count} files
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Filters */}
      <DocumentFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={CONSTRUCTION_CATEGORIES}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedStatus={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Document Grid/List View */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents found</h3>
            <p className="text-muted-foreground mb-4">
              {documents.length === 0 ? "Upload your first document to get started" : "Try adjusting your filters"}
            </p>
            {documents.length === 0 && (
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDocuments.map((document) => (
            <Card key={document.id} className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex flex-col space-y-3">
                  {/* File Icon */}
                  <div className="flex items-center justify-center h-16 w-16 mx-auto">
                    <FileTypeIcon 
                      fileName={document.name} 
                      fileType={document.file_type}
                      className="h-16 w-16"
                    />
                  </div>
                  
                  {/* Document Info */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm line-clamp-2" title={document.title || document.name}>
                      {document.title || document.name}
                    </h3>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(document.file_size)}</span>
                      <span>v{document.version || 1}</span>
                    </div>
                    
                    {document.status && (
                      <div className="flex justify-center">
                        <Badge variant="outline" className="text-xs">
                          {document.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Actions - shown on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewDocument(document);
                      }}
                    >
                      Preview
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadDocument(document.file_path, document.name);
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <DocumentListView
          documents={filteredDocuments}
          onDownload={downloadDocument}
          onDelete={deleteDocument}
          onStatusChange={handleStatusChange}
          onTypeChange={handleTypeChange}
          onAccessibilityChange={async (docId: string, accessibility: string) => {}}
          onPreview={setPreviewDocument}
          onViewDetails={setDetailsDocument}
          onViewActivity={setActivityDocument}
          onToggleLock={toggleDocumentLock}
          canEdit={filteredDocuments.some(doc => canEditDocument(doc))}
          canApprove={canApproveDocument()}
          selectedProject={currentProject.id}
        />
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
          </DialogHeader>
          <DocumentUpload 
            projectId={currentProject.id} 
            onUploadComplete={() => setUploadDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>

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

      {/* Document Activity Dialog */}
      {activityDocument && (
        <Dialog open={!!activityDocument} onOpenChange={() => setActivityDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Document Activity - {activityDocument.title || activityDocument.name}</DialogTitle>
            </DialogHeader>
            <DocumentActivity document={activityDocument} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Documents;
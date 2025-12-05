import React, { useState, useMemo, useEffect } from 'react';

import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocumentGroups, DocumentGroup } from '@/hooks/useDocumentGroups';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { DocumentDetailsDialog } from '@/components/documents/DocumentDetailsDialog';
import { DocumentFilters } from '@/components/documents/DocumentFilters';
import { DocumentListView } from '@/components/documents/DocumentListView';
import { DocumentActivity } from '@/components/documents/DocumentActivity';
import { CreateTenderPackageDialog } from '@/components/documents/CreateTenderPackageDialog';
import { useDocumentCategories } from '@/hooks/useDocumentCategories';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedFileType, setSelectedFileType] = useState<string>('all');
  const [selectedUploadedBy, setSelectedUploadedBy] = useState<string>('all');
  const [selectedRevision, setSelectedRevision] = useState<string>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<DocumentGroup | null>(null);
  const [detailsDocument, setDetailsDocument] = useState<DocumentGroup | null>(null);
  const [activityDocument, setActivityDocument] = useState<DocumentGroup | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentGroup[]>([]);
  const [createPackageDialogOpen, setCreatePackageDialogOpen] = useState(false);
  const {
    selectedProject
  } = useProjectSelection();
  const {
    profile
  } = useAuth();
  const {
    toast
  } = useToast();
  const { trackDownload } = useAnalytics();
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
    deleteDocumentGroup,
    toggleDocumentLock,
    updateDocumentMetadata
  } = useDocumentGroups(selectedProject?.id);
  
  const { categories } = useDocumentCategories(selectedProject?.id || null);
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Enhanced search - search in title, category, document number
      const searchFields = [doc.title, doc.category, doc.document_number, `rev ${doc.current_revision?.revision_number || 1}` // Include revision number
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = searchTerm === '' || searchFields.includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;

      // New filter logic
      const matchesFileType = selectedFileType === 'all' || doc.current_revision?.file_extension && doc.current_revision.file_extension.toLowerCase() === selectedFileType.toLowerCase();
      const matchesUploadedBy = selectedUploadedBy === 'all' || doc.current_revision?.uploaded_by === selectedUploadedBy;
      const matchesRevision = selectedRevision === 'all' || doc.current_revision?.revision_number && doc.current_revision.revision_number.toString() === selectedRevision;
      return matchesSearch && matchesCategory && matchesStatus && matchesFileType && matchesUploadedBy && matchesRevision;
    });
  }, [documents, searchTerm, selectedCategory, statusFilter, selectedFileType, selectedUploadedBy, selectedRevision]);
  const canEditDocument = (document: any) => {
    return document.created_by === profile?.user_id;
  };
  const canApproveDocument = () => {
    return profile?.role === 'architect';
  };
  const handleDownload = async (groupId: string) => {
    const group = documents.find(d => d.id === groupId);
    if (!group?.current_revision?.file_path) {
      toast({
        title: "Error",
        description: "No file available for download",
        variant: "destructive"
      });
      return;
    }
    try {
      const { downloadFromStorage, normalizeStorageError } = await import('@/utils/storageUtils');
      await downloadFromStorage(group.current_revision.file_path, group.current_revision.file_name || 'document');
      
      // Track document download
      trackDownload(group.current_revision.file_name || 'document');
      
      toast({
        title: "Success",
        description: "File downloaded successfully"
      });
    } catch (e: any) {
      console.error('Download failed:', e);
      const { normalizeStorageError } = await import('@/utils/storageUtils');
      toast({
        title: "Error",
        description: normalizeStorageError(e?.message),
        variant: "destructive"
      });
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

  const handleDocumentSelect = (document: DocumentGroup, selected: boolean) => {
    if (selected) {
      setSelectedDocuments(prev => [...prev, document]);
    } else {
      setSelectedDocuments(prev => prev.filter(d => d.id !== document.id));
    }
  };

  const handleCreateTenderPackage = (selectedDocs: DocumentGroup[]) => {
    setCreatePackageDialogOpen(true);
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

  // Compute available filter options from documents
  const availableFileTypes = useMemo(() => {
    const fileTypes = new Set<string>();
    documents.forEach(doc => {
      if (doc.current_revision?.file_extension) {
        fileTypes.add(doc.current_revision.file_extension.toLowerCase());
      }
    });
    return Array.from(fileTypes).sort();
  }, [documents]);
  const availableUploaders = useMemo(() => {
    const uploaders = new Map<string, {
      id: string;
      name: string;
      role: string;
    }>();
    documents.forEach(doc => {
      if (doc.current_revision?.uploaded_by && doc.current_revision?.uploaded_by_name) {
        uploaders.set(doc.current_revision.uploaded_by, {
          id: doc.current_revision.uploaded_by,
          name: doc.current_revision.uploaded_by_name,
          role: doc.current_revision.uploaded_by_role || 'User'
        });
      }
    });
    return Array.from(uploaders.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [documents]);
  const availableRevisions = useMemo(() => {
    const revisions = new Set<number>();
    documents.forEach(doc => {
      if (doc.current_revision?.revision_number) {
        revisions.add(doc.current_revision.revision_number);
      }
    });
    return Array.from(revisions).sort((a, b) => a - b);
  }, [documents]);

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
              {projects.length > 0 ? <DocumentUpload projectId={selectedProject?.id || projects[0]?.id || ''} onUploadComplete={() => {
              setUploadDialogOpen(false);
              fetchDocumentGroups(); // Refresh list after upload
            }} /> : <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No projects available. Create a project or join a project first to upload documents.
                  </p>
                </div>}
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
            selectedCategory={selectedCategory} 
            onCategoryChange={setSelectedCategory} 
            selectedStatus={statusFilter} 
            onStatusChange={setStatusFilter} 
            selectedFileType={selectedFileType} 
            onFileTypeChange={setSelectedFileType} 
            selectedUploadedBy={selectedUploadedBy} 
            onUploadedByChange={setSelectedUploadedBy} 
            selectedRevision={selectedRevision} 
            onRevisionChange={setSelectedRevision} 
            categories={categories}
            documentCounts={{
              total: statusCounts.all,
              'For Tender': statusCounts['For Tender'],
              'For Information': statusCounts['For Information'],
              'For Construction': statusCounts['For Construction']
            }} 
            availableFileTypes={availableFileTypes} 
            availableUploaders={availableUploaders} 
            availableRevisions={availableRevisions} 
          />
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
        </Card> : <DocumentListView documentGroups={filteredDocuments} onDownload={handleDownload} onDelete={deleteDocumentGroup} onStatusChange={handleStatusChange} onTypeChange={handleTypeChange} onPreview={setPreviewDocument} onViewDetails={setDetailsDocument} onViewActivity={setActivityDocument} onSupersede={supersedeDocument} onToggleLock={toggleDocumentLock} onEdit={updateDocumentMetadata} canEdit={filteredDocuments.some(doc => canEditDocument(doc))} canApprove={canApproveDocument()} selectedProject={selectedProject?.id || ''} selectedDocuments={selectedDocuments} onDocumentSelect={handleDocumentSelect} onCreateTenderPackage={handleCreateTenderPackage} />}

      {/* Document Preview Dialog */}
      {previewDocument && <DocumentPreview document={previewDocument} isOpen={!!previewDocument} onClose={() => setPreviewDocument(null)} onDownload={handleDownload} />}

      {/* Document Details Dialog */}
      <DocumentDetailsDialog document={detailsDocument} isOpen={!!detailsDocument} onClose={() => setDetailsDocument(null)} />

      {/* Document Activity Dialog */}
      {activityDocument && <Dialog open={!!activityDocument} onOpenChange={() => setActivityDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Document Activity - {activityDocument.title}</DialogTitle>
            </DialogHeader>
            <DocumentActivity document={activityDocument} />
          </DialogContent>
        </Dialog>}

      {/* Create Tender Package Dialog */}
      <CreateTenderPackageDialog
        isOpen={createPackageDialogOpen}
        onClose={() => {
          setCreatePackageDialogOpen(false);
          setSelectedDocuments([]);
        }}
        selectedDocuments={selectedDocuments}
        projectId={selectedProject?.id || ''}
      />
    </div>;
};
export default Documents;
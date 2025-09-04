import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Grid, List, Upload, Eye, GitBranch, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocuments, Document } from '@/hooks/useDocuments';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/hooks/useAuth';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentPreview } from '@/components/documents/DocumentPreview';
import { DocumentDetailsDialog } from '@/components/documents/DocumentDetailsDialog';
import { DocumentFilters } from '@/components/documents/DocumentFilters';
import { DocumentFolder } from '@/components/documents/DocumentFolder';

const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [organizationMode, setOrganizationMode] = useState<'flat' | 'folders'>('flat');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [detailsDocument, setDetailsDocument] = useState<Document | null>(null);
  
  const { profile } = useAuth();
  const { projects } = useProjects();
  const { 
    documents, 
    loading, 
    downloadDocument, 
    deleteDocument, 
    updateDocumentStatus,
    requestApproval 
  } = useDocuments(selectedProject === 'all' ? undefined : selectedProject);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [documents, searchTerm, selectedCategory, statusFilter]);

  // Group documents by category for folder view
  const documentsByCategory = useMemo(() => {
    const grouped: Record<string, Document[]> = {};
    filteredDocuments.forEach(doc => {
      const category = doc.category || 'general';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(doc);
    });
    return grouped;
  }, [filteredDocuments]);

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const canEditDocument = (document: any) => {
    return document.uploaded_by === profile?.user_id;
  };

  const canApproveDocument = () => {
    return profile?.role === 'architect';
  };

  const handleRequestApproval = async (documentId: string) => {
    // In a real app, you'd show a dialog to select approver
    // For now, we'll find the first architect in the project
    const document = documents.find(d => d.id === documentId);
    if (!document) return;

    // This would typically involve getting project users and finding architects
    // For demo purposes, we'll use the current user's ID as a placeholder
    await requestApproval(documentId, profile?.user_id || '');
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

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: Record<string, string> = {
      general: 'General Documents',
      drawings: 'Drawings & Plans',
      contracts: 'Contracts & Legal',
      reports: 'Reports & Analysis',
      specifications: 'Specifications',
      permits: 'Permits & Licenses',
      safety: 'Safety Documents'
    };
    return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
  };

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
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Manage project documents and approvals
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={organizationMode === 'flat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOrganizationMode('flat')}
          >
            <List className="h-4 w-4 mr-2" />
            List View
          </Button>
          <Button
            variant={organizationMode === 'folders' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setOrganizationMode('folders')}
          >
            <Folder className="h-4 w-4 mr-2" />
            Folder View
          </Button>
          
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
            viewMode={viewMode}
            onViewModeChange={setViewMode}
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

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="relative">
            All
            <Badge variant="secondary" className="ml-2">
              {statusCounts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="draft" className="relative">
            Draft
            <Badge variant="secondary" className="ml-2">
              {statusCounts.draft}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="under_review" className="relative">
            Review
            <Badge variant="secondary" className="ml-2">
              {statusCounts.under_review}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="relative">
            Approved
            <Badge variant="secondary" className="ml-2">
              {statusCounts.approved}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="relative">
            Rejected
            <Badge variant="secondary" className="ml-2">
              {statusCounts.rejected}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Document Content */}
      {organizationMode === 'folders' ? (
        <div className="space-y-4">
          {Object.entries(documentsByCategory)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, docs]) => (
              <DocumentFolder
                key={category}
                title={getCategoryDisplayName(category)}
                documents={docs}
                onUpload={() => setUploadDialogOpen(true)}
                onDownload={downloadDocument}
                onDelete={docs.some(doc => canEditDocument(doc)) ? deleteDocument : undefined}
                onStatusChange={docs.some(doc => canApproveDocument()) ? updateDocumentStatus : undefined}
                onRequestApproval={docs.some(doc => canEditDocument(doc)) ? handleRequestApproval : undefined}
                onViewDetails={setDetailsDocument}
                onPreview={setPreviewDocument}
                canEdit={docs.some(doc => canEditDocument(doc))}
                canApprove={canApproveDocument()}
                viewMode={viewMode}
                defaultExpanded={category === 'general' || Object.keys(documentsByCategory).length <= 3}
              />
            ))}
          
          {Object.keys(documentsByCategory).length === 0 && (
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
          )}
        </div>
      ) : (
        <>
          {/* Status Tabs */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full mb-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="relative">
                All
                <Badge variant="secondary" className="ml-2">
                  {statusCounts.all}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="draft" className="relative">
                Draft
                <Badge variant="secondary" className="ml-2">
                  {statusCounts.draft}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="under_review" className="relative">
                Review
                <Badge variant="secondary" className="ml-2">
                  {statusCounts.under_review}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approved" className="relative">
                Approved
                <Badge variant="secondary" className="ml-2">
                  {statusCounts.approved}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="relative">
                Rejected
                <Badge variant="secondary" className="ml-2">
                  {statusCounts.rejected}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Documents Grid/List */}
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
            <div className={
              viewMode === 'grid' 
                ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "space-y-4"
            }>
              {filteredDocuments.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onDownload={downloadDocument}
                  onDelete={deleteDocument}
                  onStatusChange={updateDocumentStatus}
                  onRequestApproval={handleRequestApproval}
                  onPreview={setPreviewDocument}
                  onViewDetails={setDetailsDocument}
                  canEdit={canEditDocument(document)}
                  canApprove={canApproveDocument()}
                />
              ))}
            </div>
          )}
        </>
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
    </div>
  );
};

export default Documents;
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, X, FilePlus, FolderOpen, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentTemplateDialog } from './DocumentTemplateDialog';
import { DocumentCreatorDialog } from './DocumentCreatorDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge as ProjectBadge } from '@/components/ui/badge';

interface TenderDocument {
  id: number;
  name: string;
  isConditional?: boolean;
  file?: {
    id: string;
    name: string;
    path: string;
    size: number;
    content?: string;
  } | null;
}

interface TenderPackageTrackerProps {
  tenderId?: string;
  projectData?: any;
  tenderData?: any;
}

export function TenderPackageTracker({ tenderId, projectData, tenderData }: TenderPackageTrackerProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<TenderDocument[]>([
    { id: 1, name: 'Notice to Tenderers', file: null },
    { id: 2, name: 'Conditions of Tendering', file: null },
    { id: 3, name: 'General Conditions of Contract', file: null },
    { id: 4, name: 'Contract Schedules', file: null },
    { id: 5, name: 'Tender Form', file: null },
    { id: 6, name: 'Schedules of Monetary Sums', file: null, isConditional: true },
    { id: 7, name: 'Tender Schedules', file: null },
    { id: 8, name: 'Technical Specifications', file: null },
    { id: 9, name: 'Technical Schedules', file: null },
    { id: 10, name: 'Drawings', file: null },
    { id: 11, name: 'Bills of Quantities', file: null, isConditional: true },
  ]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [chooseDialogOpen, setChooseDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<number | null>(null);
  const [previousProjects, setPreviousProjects] = useState<any[]>([]);
  const [creatorDialogOpen, setCreatorDialogOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | undefined>();

  const uploadedCount = documents.filter(doc => doc.file).length;
  const totalCount = documents.length;
  const progressPercentage = Math.round((uploadedCount / totalCount) * 100);

  // Load existing documents from database
  useEffect(() => {
    if (tenderId) {
      loadExistingDocuments();
    }
  }, [tenderId]);

  const loadExistingDocuments = async () => {
    if (!tenderId) return;

    try {
      const { data, error } = await supabase
        .from('tender_package_documents')
        .select('*')
        .eq('tender_id', tenderId);

      if (error) throw error;

      if (data) {
        setDocuments(prevDocs =>
          prevDocs.map(doc => {
            const existingDoc = data.find(d => d.document_type === doc.name);
            if (existingDoc) {
              return {
                ...doc,
                file: {
                  id: existingDoc.id,
                  name: existingDoc.document_name,
                  path: existingDoc.file_path,
                  size: existingDoc.file_size || 0,
                  content: existingDoc.document_content
                }
              };
            }
            return doc;
          })
        );
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleFileUpload = async (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !tenderId) {
      if (!tenderId) {
        toast({
          title: "Error",
          description: "Please save the tender first before uploading documents.",
          variant: "destructive"
        });
      }
      return;
    }

    setUploading(id);

    try {
      const doc = documents.find(d => d.id === id);
      if (!doc) return;

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenderId}/${doc.name.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tender-packages')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Save document metadata to database
      const { data: docData, error: docError } = await supabase
        .from('tender_package_documents')
        .insert({
          tender_id: tenderId,
          document_type: doc.name,
          document_name: file.name,
          file_path: fileName,
          file_size: file.size,
          uploaded_by: profile?.user_id
        })
        .select()
        .single();

      if (docError) throw docError;

      setDocuments(docs =>
        docs.map(d =>
          d.id === id ? {
            ...d,
            file: {
              id: docData.id,
              name: file.name,
              path: fileName,
              size: file.size
            }
          } : d
        )
      );

      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveFile = async (id: number) => {
    const doc = documents.find(d => d.id === id);
    if (!doc?.file) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('tender-packages')
        .remove([doc.file.path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('tender_package_documents')
        .delete()
        .eq('id', doc.file.id);

      if (dbError) throw dbError;

      setDocuments(docs =>
        docs.map(d =>
          d.id === id ? { ...d, file: null } : d
        )
      );

      toast({
        title: "File removed",
        description: "File has been removed successfully."
      });
    } catch (error: any) {
      console.error('Remove error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove file",
        variant: "destructive"
      });
    }
  };

  const handleShowTemplate = (docName: string) => {
    setSelectedTemplate(docName);
    setTemplateDialogOpen(true);
  };

  const handleCreateDocument = (docId: number, docName: string) => {
    setSelectedDocType(docId);
    setSelectedTemplate(docName);
    setEditingDocId(undefined);
    setCreatorDialogOpen(true);
  };

  const handleEditDocument = (docId: number, fileId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    
    setSelectedDocType(docId);
    setSelectedTemplate(doc.name);
    setEditingDocId(fileId);
    setCreatorDialogOpen(true);
  };

  const handleChooseFromProjects = async (docId: number, docName: string) => {
    setSelectedDocType(docId);
    
    // Fetch projects with tenders that have this document type
    try {
      const { data: tenderDocs, error } = await supabase
        .from('tender_package_documents')
        .select(`
          *,
          tenders!inner(
            id,
            title,
            project_id,
            projects!inner(id, name)
          )
        `)
        .eq('document_type', docName)
        .neq('tender_id', tenderId || '');

      if (error) throw error;

      // Group by project
      const projectMap = new Map();
      tenderDocs?.forEach(doc => {
        const projectId = doc.tenders.project_id;
        const projectName = doc.tenders.projects.name;
        if (!projectMap.has(projectId)) {
          projectMap.set(projectId, {
            id: projectId,
            name: projectName,
            documents: []
          });
        }
        projectMap.get(projectId).documents.push(doc);
      });

      setPreviousProjects(Array.from(projectMap.values()));
      setChooseDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching previous projects:', error);
      toast({
        title: "Error",
        description: "Failed to load previous projects",
        variant: "destructive"
      });
    }
  };

  const handleSelectPreviousDocument = async (selectedDoc: any) => {
    if (!selectedDocType || !tenderId) return;

    // Open the document in the creator dialog for editing
    setEditingDocId(selectedDoc.id);
    setChooseDialogOpen(false);
    setCreatorDialogOpen(true);
  };

  const handleDocumentSaved = (docData: any) => {
    const doc = documents.find(d => d.id === selectedDocType);
    if (!doc) return;

    setDocuments(docs =>
      docs.map(d =>
        d.id === selectedDocType ? {
          ...d,
          file: {
            id: docData.id,
            name: docData.document_name,
            path: docData.file_path,
            size: 0,
            content: docData.document_content
          }
        } : d
      )
    );
  };

  const handleRemoveDocument = (id: number) => {
    setDocuments(docs => docs.filter(d => d.id !== id));
    toast({
      title: "Document removed",
      description: "Document has been removed from the list."
    });
  };

  return (
    <Card className="border-border/40">{/* ... keep existing code */}

      <CardContent className="p-6">
        {/* Documents Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-16">Item</TableHead>
                <TableHead>Document Name</TableHead>
                <TableHead className="w-32 text-center">Status</TableHead>
                <TableHead className="w-48 text-center">File Preview</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/20">
                  <TableCell className="font-semibold text-primary">{doc.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{doc.name}</span>
                      {doc.isConditional && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Conditional
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {doc.file ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        Uploaded
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted">
                        Not Uploaded
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {doc.file ? (
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDocument(doc.id, doc.file!.id)}
                          className="flex items-center gap-2 px-3 py-1 hover:bg-primary/10"
                        >
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm text-foreground truncate max-w-[120px]">
                            {doc.file.name}
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(doc.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={uploading === doc.id}
                            >
                              Add Document
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleCreateDocument(doc.id, doc.name)}>
                              <FilePlus className="h-4 w-4 mr-2" />
                              Create from Template
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <label htmlFor={`file-upload-${doc.id}`} className="cursor-pointer">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload
                                <input
                                  id={`file-upload-${doc.id}`}
                                  type="file"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(doc.id, e)}
                                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                                  disabled={uploading === doc.id}
                                />
                              </label>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleChooseFromProjects(doc.id, doc.name)}>
                              <FolderOpen className="h-4 w-4 mr-2" />
                              Choose from Previous Projects
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          title="Remove this document from list"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <DocumentCreatorDialog
        open={creatorDialogOpen}
        onOpenChange={setCreatorDialogOpen}
        documentName={selectedTemplate}
        tenderId={tenderId || ''}
        projectData={projectData}
        tenderData={tenderData}
        existingDocumentId={editingDocId}
        onDocumentSaved={handleDocumentSaved}
      />

      <Dialog open={chooseDialogOpen} onOpenChange={setChooseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose from Previous Projects</DialogTitle>
            <DialogDescription>
              Select a project to use its {selectedTemplate} document as a starting point
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px]">
            {previousProjects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No previous projects with this document type found
              </p>
            ) : (
              <div className="space-y-3">
                {previousProjects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-foreground">{project.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.documents.length} version{project.documents.length !== 1 ? 's' : ''} available
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 mt-3">
                      {project.documents.map((doc: any) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-2 bg-muted/30 rounded cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSelectPreviousDocument(doc)}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm">{doc.document_name}</span>
                          </div>
                          <ProjectBadge variant="outline" className="text-xs">
                            Select & Edit
                          </ProjectBadge>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TenderDocument {
  id: number;
  name: string;
  isConditional?: boolean;
  file?: {
    id: string;
    name: string;
    path: string;
    size: number;
  } | null;
}

interface TenderPackageTrackerProps {
  tenderId?: string;
}

export function TenderPackageTracker({ tenderId }: TenderPackageTrackerProps) {
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
  const [previousDocuments, setPreviousDocuments] = useState<any[]>([]);

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
                  size: existingDoc.file_size || 0
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

  const handleChooseDocument = async (docId: number, docName: string) => {
    setSelectedDocType(docId);
    
    // Fetch previous documents of this type from other tenders
    try {
      const { data, error } = await supabase
        .from('tender_package_documents')
        .select('*, tenders:tender_id(project_name)')
        .eq('document_type', docName)
        .neq('tender_id', tenderId || '')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPreviousDocuments(data || []);
      setChooseDialogOpen(true);
    } catch (error: any) {
      console.error('Error fetching previous documents:', error);
      toast({
        title: "Error",
        description: "Failed to load previous documents",
        variant: "destructive"
      });
    }
  };

  const handleSelectPreviousDocument = async (selectedDoc: any) => {
    if (!selectedDocType || !tenderId) return;

    try {
      const doc = documents.find(d => d.id === selectedDocType);
      if (!doc) return;

      // Copy file in storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('tender-packages')
        .download(selectedDoc.file_path);

      if (downloadError) throw downloadError;

      const fileExt = selectedDoc.file_path.split('.').pop();
      const newFileName = `${tenderId}/${doc.name.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('tender-packages')
        .upload(newFileName, fileData);

      if (uploadError) throw uploadError;

      // Save to database
      const { data: docData, error: docError } = await supabase
        .from('tender_package_documents')
        .insert({
          tender_id: tenderId,
          document_type: doc.name,
          document_name: selectedDoc.document_name,
          file_path: newFileName,
          file_size: selectedDoc.file_size,
          uploaded_by: profile?.user_id
        })
        .select()
        .single();

      if (docError) throw docError;

      setDocuments(docs =>
        docs.map(d =>
          d.id === selectedDocType ? {
            ...d,
            file: {
              id: docData.id,
              name: selectedDoc.document_name,
              path: newFileName,
              size: selectedDoc.file_size
            }
          } : d
        )
      );

      setChooseDialogOpen(false);
      toast({
        title: "Document added",
        description: "Previous document has been added successfully."
      });
    } catch (error: any) {
      console.error('Error selecting document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add document",
        variant: "destructive"
      });
    }
  };

  const handleRemoveDocument = (id: number) => {
    setDocuments(docs => docs.filter(d => d.id !== id));
    toast({
      title: "Document removed",
      description: "Document has been removed from the list."
    });
  };

  return (
    <Card className="border-border/40">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/40">
        <CardTitle className="text-2xl">Tender Package Tracker</CardTitle>
        <CardDescription className="mt-2">
          Upload required documents for the tender package
        </CardDescription>
      </CardHeader>

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
                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm text-foreground truncate max-w-[120px]">
                            {doc.file.name}
                          </span>
                        </div>
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
                            <DropdownMenuItem onClick={() => handleShowTemplate(doc.name)}>
                              <FilePlus className="h-4 w-4 mr-2" />
                              Create (View Template)
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
                            <DropdownMenuItem onClick={() => handleChooseDocument(doc.id, doc.name)}>
                              <FolderOpen className="h-4 w-4 mr-2" />
                              Choose from Previous
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

      <DocumentTemplateDialog
        open={templateDialogOpen}
        onOpenChange={setTemplateDialogOpen}
        documentName={selectedTemplate}
      />

      <Dialog open={chooseDialogOpen} onOpenChange={setChooseDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose from Previous Documents</DialogTitle>
            <DialogDescription>
              Select a document from previous tenders
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[400px]">
            {previousDocuments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No previous documents of this type found
              </p>
            ) : (
              <div className="space-y-2">
                {previousDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSelectPreviousDocument(doc)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{doc.document_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.tenders?.project_name || 'Unknown Project'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Select</Badge>
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

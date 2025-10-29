import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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

  return (
    <Card className="border-border/40">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/40">
        <CardTitle className="text-2xl">Tender Package Tracker</CardTitle>
        <CardDescription className="mt-2">
          Upload required documents for the tender package
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        {/* Progress Section */}
        <div className="bg-muted/30 rounded-lg p-6 mb-6 border border-border/40">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-foreground">
              Progress: {uploadedCount} of {totalCount} items uploaded
            </span>
            <span className="font-semibold text-primary">{progressPercentage}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

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
                      <div className="flex justify-center">
                        <label htmlFor={`file-upload-${doc.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="cursor-pointer h-8 w-8 p-0"
                            disabled={uploading === doc.id}
                            asChild
                          >
                            <span>
                              <Upload className="h-4 w-4" />
                            </span>
                          </Button>
                          <input
                            id={`file-upload-${doc.id}`}
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(doc.id, e)}
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                            disabled={uploading === doc.id}
                          />
                        </label>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/40">
          <Card className="bg-muted/30 border-border/40">
            <CardContent className="p-6 text-center">
              <p className="text-xs uppercase text-muted-foreground font-semibold mb-2">
                Uploaded
              </p>
              <p className="text-4xl font-bold text-primary">{uploadedCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-border/40">
            <CardContent className="p-6 text-center">
              <p className="text-xs uppercase text-muted-foreground font-semibold mb-2">
                Remaining
              </p>
              <p className="text-4xl font-bold text-primary">{totalCount - uploadedCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30 border-border/40">
            <CardContent className="p-6 text-center">
              <p className="text-xs uppercase text-muted-foreground font-semibold mb-2">
                Overall Progress
              </p>
              <p className="text-4xl font-bold text-primary">{progressPercentage}%</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}

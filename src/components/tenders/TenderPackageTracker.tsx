import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileText, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TenderDocument {
  id: number;
  name: string;
  isConditional?: boolean;
  file?: File | null;
}

export function TenderPackageTracker() {
  const { toast } = useToast();
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

  const handleFileUpload = (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDocuments(docs =>
        docs.map(doc =>
          doc.id === id ? { ...doc, file } : doc
        )
      );
      toast({
        title: "File uploaded",
        description: `${file.name} has been uploaded successfully.`
      });
    }
  };

  const handleRemoveFile = (id: number) => {
    setDocuments(docs =>
      docs.map(doc =>
        doc.id === id ? { ...doc, file: null } : doc
      )
    );
    toast({
      title: "File removed",
      description: "File has been removed successfully."
    });
  };

  return (
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
                        className="cursor-pointer"
                        asChild
                      >
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </span>
                      </Button>
                      <input
                        id={`file-upload-${doc.id}`}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(doc.id, e)}
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
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
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface LineItemImporterProps {
  projectId: string;
  onImportComplete: () => void;
}

interface ParsedLineItem {
  item_name: string;
  description?: string;
  category: string;
  quantity?: number;
  unit?: string;
  rate?: number;
  total: number;
  notes?: string;
}

export function LineItemImporter({ projectId, onImportComplete }: LineItemImporterProps) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setFile(acceptedFiles[0]);
      }
    },
  });

  const parseDocumentContent = async (fileToUpload: File): Promise<ParsedLineItem[]> => {
    try {
      const fileName = `temp-${Date.now()}-${fileToUpload.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, fileToUpload);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      const { data, error } = await supabase.functions.invoke('parse-line-items', {
        body: { fileUrl: publicUrl, fileName: fileToUpload.name },
      });

      await supabase.storage.from('documents').remove([fileName]);

      if (error) throw error;

      return data.lineItems || [];
    } catch (error) {
      console.error('Error parsing document:', error);
      throw error;
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const parsedItems = await parseDocumentContent(file);

      if (parsedItems.length === 0) {
        toast({
          title: "No items found",
          description: "Could not extract line items from the document",
          variant: "destructive",
        });
        return;
      }

      const { data: existingItems } = await supabase
        .from('line_item_budgets')
        .select('item_number')
        .eq('project_id', projectId)
        .order('item_number', { ascending: false })
        .limit(1);

      let nextItemNumber = 1;
      if (existingItems && existingItems.length > 0) {
        nextItemNumber = existingItems[0].item_number + 1;
      }

      const itemsToInsert = parsedItems.map((item, index) => ({
        project_id: projectId,
        item_number: nextItemNumber + index,
        item_name: item.item_name,
        description: item.description || null,
        category: item.category,
        quantity: item.quantity || null,
        unit: item.unit || null,
        rate: item.rate || null,
        total: item.total,
        contract_budget: item.total,
        balance_to_claim: item.total,
        notes: item.notes || null,
      }));

      const { error: insertError } = await supabase
        .from('line_item_budgets')
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: `Imported ${parsedItems.length} line items successfully`,
      });

      setOpen(false);
      setFile(null);
      onImportComplete();
    } catch (error) {
      console.error('Error importing line items:', error);
      toast({
        title: "Import failed",
        description: "Failed to import line items from document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import from File
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Line Items</DialogTitle>
          <DialogDescription>
            Upload a tender package (PDF, Excel, Word) with columns: Section, Item, Description, Quantity, Unit, Rate, Total, Notes
          </DialogDescription>
        </DialogHeader>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <FileText className="h-12 w-12 text-muted-foreground" />
            {file ? (
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to select (PDF, Excel, Word)
                </p>
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              'Import'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

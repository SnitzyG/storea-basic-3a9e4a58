import React, { useState, useEffect } from 'react';
import { FileText, Upload, Paperclip, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocuments } from '@/hooks/useDocuments';
import { useRFIs } from '@/hooks/useRFIs';

interface FileSelectorProps {
  projectId: string;
  selectedFiles: any[];
  onFileSelect: (file: any) => void;
  onFileRemove: (index: number) => void;
  onUploadNew: (files: File[]) => void;
}

export const FileSelector: React.FC<FileSelectorProps> = ({
  projectId,
  selectedFiles,
  onFileSelect,
  onFileRemove,
  onUploadNew
}) => {
  const { documents } = useDocuments(projectId);
  const { rfis } = useRFIs(projectId);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewFiles(files);
    onUploadNew(files);
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) {
      return <FileText className="h-4 w-4" />;
    }
    return <Paperclip className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="rfis">RFIs</TabsTrigger>
          <TabsTrigger value="upload">Upload New</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents">
          <ScrollArea className="h-40 border rounded-lg p-2">
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                  onClick={() => onFileSelect({
                    id: doc.id,
                    name: doc.name,
                    type: 'document',
                    file_path: doc.file_path
                  })}
                >
                  <div className="flex items-center gap-2">
                    {getFileIcon(doc.name)}
                    <span className="text-sm truncate">{doc.name}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {doc.status}
                  </Badge>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No documents available
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="rfis">
          <ScrollArea className="h-40 border rounded-lg p-2">
            <div className="space-y-2">
              {rfis.map((rfi) => (
                <div
                  key={rfi.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                  onClick={() => onFileSelect({
                    id: rfi.id,
                    name: `RFI: ${rfi.subject || rfi.question.substring(0, 50)}...`,
                    type: 'rfi',
                    rfi_number: rfi.rfi_number
                  })}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm truncate">
                      {rfi.rfi_number || `RFI ${rfi.id.slice(0, 8)}`}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {rfi.status}
                  </Badge>
                </div>
              ))}
              {rfis.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No RFIs available
                </p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="upload">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Upload new files to attach to this message
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
            />
            <Button asChild variant="outline" size="sm">
              <label htmlFor="file-upload" className="cursor-pointer">
                Choose Files
              </label>
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected Files:</p>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-2 pr-1">
                {getFileIcon(file.name)}
                <span className="text-xs">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => onFileRemove(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatFileSize } from '@/utils/documentUtils';

interface AttachmentFile {
  id: string;
  file: File;
  preview?: string;
}

interface RFIAttachmentUploadProps {
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/zip': ['.zip'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv']
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_FILES = 5; // Limit to 5 files per RFI

export const RFIAttachmentUpload: React.FC<RFIAttachmentUploadProps> = ({
  onFilesChange,
  disabled = false
}) => {
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled) return;
    
    // Check file count limit
    if (attachments.length + acceptedFiles.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} files allowed per RFI`);
      return;
    }

    const newAttachments: AttachmentFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2),
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
    }));

    const updatedAttachments = [...attachments, ...newAttachments];
    setAttachments(updatedAttachments);
    onFilesChange(updatedAttachments.map(a => a.file));
  }, [attachments, onFilesChange, disabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
    disabled
  });

  const removeFile = (fileId: string) => {
    if (disabled) return;
    
    const updatedAttachments = attachments.filter(a => a.id !== fileId);
    setAttachments(updatedAttachments);
    onFilesChange(updatedAttachments.map(a => a.file));
  };

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      attachments.forEach(attachment => {
        if (attachment.preview) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Paperclip className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        {isDragActive ? (
          <p className="text-sm font-medium">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-sm font-medium mb-1">
              Drag & drop files here, or click to select
            </p>
            <p className="text-xs text-muted-foreground">
              Up to {MAX_FILES} files • PDF, JPG, PNG, DOCX, XLSX, ZIP, TXT, CSV (max 25MB each)
            </p>
          </div>
        )}
      </div>

      {attachments.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Paperclip className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Attachments ({attachments.length})
              </span>
            </div>
            
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                >
                  <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file.size)}
                    </p>
                  </div>

                  <Badge variant="secondary" className="text-xs">
                    {attachment.file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </Badge>

                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(attachment.id)}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
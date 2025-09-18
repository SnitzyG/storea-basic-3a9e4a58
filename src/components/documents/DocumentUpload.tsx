import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useDocumentGroups } from '@/hooks/useDocumentGroups';
import { getFileExtension, formatFileSize } from '@/utils/documentUtils';

interface DocumentUploadProps {
  projectId: string;
  onUploadComplete?: () => void;
}

interface UploadFile {
  id: string;
  file: File; // Store original File object separately
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  documentNumber?: string;
  title?: string;
  documentStatus?: 'For Tender' | 'For Information' | 'For Construction';
  fileType?: 'Architectural' | 'Structural' | 'Permit';
  isPrivate?: boolean;
  revisionDisplay?: string;
  version?: number;
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/zip': ['.zip'],
  'image/vnd.dwg': ['.dwg']
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  projectId,
  onUploadComplete
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { createDocumentGroup } = useDocumentGroups();

  const STATUS_OPTIONS = ['For Tender', 'For Information', 'For Construction'] as const;
  const FILE_TYPE_OPTIONS = ['Architectural', 'Structural', 'Permit'] as const;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(2),
      file: file, // Store the original File object
      progress: 0,
      status: 'pending',
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
      documentStatus: 'For Information',
      fileType: 'Architectural',
      isPrivate: false,
      revisionDisplay: 'A',
      version: 1
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileProperty = (fileId: string, property: keyof UploadFile, value: any) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, [property]: value } : f
    ));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    // Validate required fields
    const invalidFiles = files.filter(f => 
      f.status === 'pending' && (!f.title?.trim() || !f.documentNumber?.trim() || !f.documentStatus || !f.fileType)
    );

    if (invalidFiles.length > 0) {
      invalidFiles.forEach(f => {
        setFiles(prev => prev.map(file => 
          file.id === f.id 
            ? { ...file, status: 'error', error: 'Please fill in all required fields' } 
            : file
        ));
      });
      return;
    }

    setIsUploading(true);

    for (const file of files) {
      if (file.status !== 'pending') continue;

      setFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f
      ));

      try {
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => 
            f.id === file.id && f.status === 'uploading' 
              ? { ...f, progress: Math.min(f.progress + 10, 90) } 
              : f
          ));
        }, 200);

        console.log('Uploading file:', { 
          name: file.file.name, 
          title: file.title,
          documentNumber: file.documentNumber,
          status: file.documentStatus,
          fileType: file.fileType,
          projectId 
        });
        
        const result = await createDocumentGroup(
          file.file,
          projectId,
          file.title || file.file.name,
          {
            documentNumber: file.documentNumber,
            status: file.documentStatus!,
            category: file.fileType!,
            isPrivate: file.isPrivate
          }
        );

        clearInterval(progressInterval);

        if (result) {
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'success', progress: 100 } 
              : f
          ));
        } else {
          setFiles(prev => prev.map(f => 
            f.id === file.id 
              ? { ...f, status: 'error', progress: 0, error: 'Upload failed' } 
              : f
          ));
        }
      } catch (error) {
        console.error('Upload error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        
        setFiles(prev => prev.map(f => 
          f.id === file.id 
            ? { ...f, status: 'error', progress: 0, error: errorMessage } 
            : f
        ));
      }
    }

    setIsUploading(false);
    onUploadComplete?.();
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status === 'pending' || f.status === 'uploading'));
  };

  // Use the imported formatFileSize utility function
  // (removed local implementation)

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'uploading': return 'default';
      case 'success': return 'default';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-muted-foreground">
                Supports: PDF, JPG, PNG, DOCX, XLSX, DWG, ZIP (max 25MB each)
              </p>
            </div>
          )}
        </div>

        {files.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Files to Upload</h3>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompleted}
                  disabled={isUploading}
                >
                  Clear Completed
                </Button>
                <Button
                  onClick={uploadFiles}
                  disabled={isUploading || files.every(f => f.status !== 'pending')}
                  size="sm"
                >
                  {isUploading ? 'Uploading...' : 'Upload All'}
                </Button>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col gap-4 p-4 bg-muted/50 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{file.file.name}</p>
                        <Badge variant={getStatusColor(file.status)} className="flex-shrink-0">
                          {file.status === 'success' && <Check className="h-3 w-3 mr-1" />}
                          {file.status === 'uploading' && (
                            <div className="h-3 w-3 mr-1 animate-spin rounded-full border-2 border-background border-t-transparent" />
                          )}
                          {file.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.file.size)}</span>
                        {file.error && (
                          <span className="text-destructive">• {file.error}</span>
                        )}
                      </div>
                      
                      {file.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Uploading...</span>
                            <span>{file.progress}%</span>
                          </div>
                          <Progress value={file.progress} className="h-2" />
                        </div>
                      )}
                    </div>

                    {file.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        disabled={isUploading}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Document metadata fields - only show for pending files */}
                  {file.status === 'pending' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3 border-t">
                      <div className="space-y-2">
                        <Label htmlFor={`title-${file.id}`}>
                          Title <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`title-${file.id}`}
                          value={file.title || ''}
                          onChange={(e) => updateFileProperty(file.id, 'title', e.target.value)}
                          placeholder="Enter document title"
                          disabled={isUploading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`docnum-${file.id}`}>
                          Document No. <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`docnum-${file.id}`}
                          value={file.documentNumber || ''}
                          onChange={(e) => updateFileProperty(file.id, 'documentNumber', e.target.value)}
                          placeholder="Enter document number"
                          disabled={isUploading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`status-${file.id}`}>
                          Status <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={file.documentStatus}
                          onValueChange={(value) => updateFileProperty(file.id, 'documentStatus', value)}
                          disabled={isUploading}
                        >
                          <SelectTrigger id={`status-${file.id}`}>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`revision-${file.id}`}>
                          Revision Number
                        </Label>
                        <Input
                          id={`revision-${file.id}`}
                          value={file.revisionDisplay || ''}
                          onChange={(e) => {
                            const value = e.target.value.trim();
                            // Support A-Z, numbers, and alphanumeric combinations
                            if (value === '' || /^[A-Za-z0-9]+$/.test(value)) {
                              updateFileProperty(file.id, 'revisionDisplay', value.toUpperCase());
                              // Convert to version number for storage
                              const versionNum = value === '' ? 1 : 
                                /^[A-Z]$/.test(value.toUpperCase()) ? value.toUpperCase().charCodeAt(0) - 64 :
                                /^[0-9]+$/.test(value) ? parseInt(value) : 1;
                              updateFileProperty(file.id, 'version', versionNum);
                            }
                          }}
                          placeholder="A, 1, A1, etc."
                          maxLength={10}
                          disabled={isUploading}
                        />
                        <p className="text-xs text-muted-foreground">
                          Supports letters (A-Z), numbers (1-100), or combinations (A1, B2, etc.)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`filetype-${file.id}`}>
                          Category <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={file.fileType}
                          onValueChange={(value) => updateFileProperty(file.id, 'fileType', value)}
                          disabled={isUploading}
                        >
                          <SelectTrigger id={`filetype-${file.id}`}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {FILE_TYPE_OPTIONS.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Privacy Toggle - Enhanced visibility */}
                      <div className="col-span-2 p-4 bg-muted/30 rounded-lg border border-dashed">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label htmlFor={`private-${file.id}`} className="text-sm font-semibold flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              Document Privacy
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Private documents are only visible to you and people you specifically share them with.
                              Public documents are visible to all project members.
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Switch
                              id={`private-${file.id}`}
                              checked={file.isPrivate || false}
                              onCheckedChange={(checked) => updateFileProperty(file.id, 'isPrivate', checked)}
                              disabled={isUploading}
                            />
                            <span className="text-xs font-medium">
                              {file.isPrivate ? 'Private' : 'Public'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
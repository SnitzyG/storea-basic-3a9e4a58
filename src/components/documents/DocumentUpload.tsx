import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useDocuments } from '@/hooks/useDocuments';

interface UploadFile extends File {
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  documentNumber?: string;
  title?: string;
  statusCategory?: string;
  fileTypeCategory?: string;
}

interface DocumentUploadProps {
  projectId: string;
  onUploadComplete?: () => void;
}

const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const STATUS_OPTIONS = [
  'For Tender',
  'For Information', 
  'For Construction'
];

const FILE_TYPE_OPTIONS = [
  'Architectural',
  'Structural',
  'Permit'
];

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  projectId,
  onUploadComplete
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const { uploadDocument } = useDocuments();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      ...file,
      id: `${Date.now()}-${Math.random()}`,
      progress: 0,
      status: 'pending' as const,
      documentNumber: '',
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
      statusCategory: 'For Information',
      fileTypeCategory: 'Architectural'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(rejection => {
        const errorMessages = rejection.errors.map(error => {
          if (error.code === 'file-too-large') {
            return `File "${rejection.file.name}" is too large. Maximum size is 50MB.`;
          }
          if (error.code === 'file-invalid-type') {
            return `File "${rejection.file.name}" has an invalid type.`;
          }
          return error.message;
        });
        
        toast({
          title: "Upload Error",
          description: errorMessages.join(' '),
          variant: "destructive"
        });
      });
    }
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const updateFileField = (fileId: string, field: keyof UploadFile, value: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, [field]: value } : file
    ));
  };

  const uploadFiles = async () => {
    const pendingFiles = files.filter(file => file.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);

    for (const file of pendingFiles) {
      try {
        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'uploading', progress: 0 } : f
        ));

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setFiles(prev => prev.map(f => {
            if (f.id === file.id && f.progress < 90) {
              return { ...f, progress: f.progress + Math.random() * 20 };
            }
            return f;
          }));
        }, 100);

        // Perform actual upload
        await uploadDocument(file, projectId, file.title, {
          documentNumber: file.documentNumber,
          statusCategory: file.statusCategory,
          fileTypeCategory: file.fileTypeCategory
        });

        // Clear progress interval and mark as success
        clearInterval(progressInterval);
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'success', progress: 100 } : f
        ));

        toast({
          title: "Upload Successful",
          description: `"${file.title}" has been uploaded successfully.`
        });

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { 
            ...f, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Upload failed'
          } : f
        ));

        toast({
          title: "Upload Failed",
          description: `Failed to upload "${file.title}". Please try again.`,
          variant: "destructive"
        });
      }
    }

    setIsUploading(false);
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(file => file.status !== 'success' && file.status !== 'error'));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'uploading': return 'secondary';
      default: return 'outline';
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />;
    } else if (file.type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-lg font-medium mb-2">
                Drag & drop files here, or click to select files
              </p>
              <p className="text-sm text-muted-foreground">
                Supports PDF, Word, Excel, and Image files up to 50MB each
              </p>
            </div>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Files to Upload</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearCompleted}
                  disabled={files.every(f => f.status === 'pending' || f.status === 'uploading')}
                >
                  Clear Completed
                </Button>
                <Button 
                  onClick={uploadFiles}
                  disabled={isUploading || files.every(f => f.status !== 'pending')}
                  size="sm"
                >
                  Upload All
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {files.map((file) => (
                <Card key={file.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(file.status)}>
                          {file.status === 'uploading' && `${Math.round(file.progress)}%`}
                          {file.status === 'success' && 'Uploaded'}
                          {file.status === 'error' && 'Failed'}
                          {file.status === 'pending' && 'Ready'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeFile(file.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="w-full" />
                    )}

                    {file.status === 'error' && file.error && (
                      <div className="flex items-center gap-2 text-destructive text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        {file.error}
                      </div>
                    )}

                    {file.status === 'pending' && (
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`title-${file.id}`}>Document Title</Label>
                          <Input
                            id={`title-${file.id}`}
                            value={file.title || ''}
                            onChange={(e) => updateFileField(file.id, 'title', e.target.value)}
                            placeholder="Enter document title"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`docnum-${file.id}`}>Document No. (Optional)</Label>
                          <Input
                            id={`docnum-${file.id}`}
                            value={file.documentNumber || ''}
                            onChange={(e) => updateFileField(file.id, 'documentNumber', e.target.value)}
                            placeholder="Enter document number"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`status-${file.id}`}>Status *</Label>
                          <Select
                            value={file.statusCategory}
                            onValueChange={(value) => updateFileField(file.id, 'statusCategory', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map(status => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`filetype-${file.id}`}>File Type *</Label>
                          <Select
                            value={file.fileTypeCategory}
                            onValueChange={(value) => updateFileField(file.id, 'fileTypeCategory', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select file type" />
                            </SelectTrigger>
                            <SelectContent>
                              {FILE_TYPE_OPTIONS.map(type => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatFileSize } from '@/utils/documentUtils';

interface UploadFile extends File {
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  title?: string;
  description?: string;
  category?: string;
}

interface DocumentUploaderProps {
  onUpload: (files: File[], metadata?: any) => Promise<void>;
  categories: Array<{id: string; name: string}>;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
}

export const DocumentUploader = ({
  onUpload,
  categories,
  maxFileSize = 50,
  acceptedTypes = ['.pdf', '.doc', '.docx', '.dwg', '.jpg', '.png', '.gif', '.xls', '.xlsx']
}: DocumentUploaderProps) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [globalCategory, setGlobalCategory] = useState<string>('');

  const maxFileSizeBytes = maxFileSize * 1024 * 1024;

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(rejection => {
        console.warn('File rejected:', rejection.file.name, rejection.errors);
      });
    }

    // Add accepted files
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substring(2),
      progress: 0,
      status: 'pending',
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension for title
      category: globalCategory || categories[0]?.id || 'general'
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, [globalCategory, categories]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxFileSizeBytes,
    multiple: true,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>)
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateFileProperty = (fileId: string, property: keyof UploadFile, value: any) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, [property]: value } : f
    ));
  };

  const applyGlobalCategory = () => {
    if (!globalCategory) return;
    setFiles(prev => prev.map(f => ({ ...f, category: globalCategory })));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    // Validate required fields
    const invalidFiles = files.filter(f => 
      f.status === 'pending' && (!f.title?.trim() || !f.category)
    );

    if (invalidFiles.length > 0) {
      invalidFiles.forEach(f => {
        updateFileProperty(f.id, 'status', 'error');
        updateFileProperty(f.id, 'error', 'Please fill in all required fields');
      });
      return;
    }

    setIsUploading(true);

    try {
      // Update all files to uploading status
      const pendingFiles = files.filter(f => f.status === 'pending');
      pendingFiles.forEach(f => {
        updateFileProperty(f.id, 'status', 'uploading');
      });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.status === 'uploading' 
            ? { ...f, progress: Math.min(f.progress + 15, 90) } 
            : f
        ));
      }, 500);

      // Prepare metadata
      const metadata = {
        files: files.map(f => ({
          title: f.title,
          description: f.description,
          category: f.category
        }))
      };

      // Call the upload function
      await onUpload(pendingFiles, metadata);

      clearInterval(progressInterval);

      // Mark all as successful
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' 
          ? { ...f, status: 'success', progress: 100 } 
          : f
      ));

    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' 
          ? { ...f, status: 'error', progress: 0, error: 'Upload failed' } 
          : f
      ));
    } finally {
      setIsUploading(false);
    }
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status === 'pending' || f.status === 'uploading'));
  };

  const getStatusColor = (status: UploadFile['status']) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'uploading': return 'default';
      case 'success': return 'default';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'success': return <Check className="h-3 w-3" />;
      case 'error': return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Category Selection */}
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Label htmlFor="global-category">Apply Category to All Files</Label>
          <Select value={globalCategory} onValueChange={setGlobalCategory}>
            <SelectTrigger id="global-category">
              <SelectValue placeholder="Select a category for all files" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button 
          variant="outline" 
          onClick={applyGlobalCategory}
          disabled={!globalCategory || files.length === 0}
        >
          Apply to All
        </Button>
      </div>

      {/* Drop Zone */}
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
                  Supports: {acceptedTypes.join(', ')} (max {maxFileSize}MB each)
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium">Files to Upload ({files.length})</h3>
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
                  {isUploading ? 'Uploading...' : `Upload ${files.filter(f => f.status === 'pending').length} Files`}
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex flex-col gap-4 p-4 bg-muted/30 rounded-lg border"
                >
                  {/* File Header */}
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <Badge variant={getStatusColor(file.status)} className="flex items-center gap-1">
                          {getStatusIcon(file.status)}
                          {file.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        {file.error && (
                          <span className="text-destructive">• {file.error}</span>
                        )}
                      </div>
                      
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="mt-2 h-1" />
                      )}
                    </div>

                    {file.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Metadata Fields - only show for pending files */}
                  {file.status === 'pending' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t">
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
                        <Label htmlFor={`category-${file.id}`}>
                          Category <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={file.category}
                          onValueChange={(value) => updateFileProperty(file.id, 'category', value)}
                          disabled={isUploading}
                        >
                          <SelectTrigger id={`category-${file.id}`}>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="col-span-2 space-y-2">
                        <Label htmlFor={`description-${file.id}`}>Description</Label>
                        <Textarea
                          id={`description-${file.id}`}
                          value={file.description || ''}
                          onChange={(e) => updateFileProperty(file.id, 'description', e.target.value)}
                          placeholder="Enter document description (optional)"
                          disabled={isUploading}
                          rows={2}
                        />
                      </div>
                    </div>
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
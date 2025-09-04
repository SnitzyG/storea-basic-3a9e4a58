import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  Trash2, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  category: string;
  uploadProgress: number;
  status: 'uploading' | 'completed' | 'error';
  file?: File;
  url?: string;
}

interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  maxFiles: number;
  acceptedTypes: string[];
}

interface DocumentUploadSystemProps {
  categories?: DocumentCategory[];
  onFilesUploaded?: (files: UploadedFile[]) => void;
  maxFileSize?: number; // in MB
  allowMultiple?: boolean;
  className?: string;
}

const DEFAULT_CATEGORIES: DocumentCategory[] = [
  {
    id: 'insurance',
    name: 'Insurance Certificates',
    description: 'Public liability, workers compensation, professional indemnity',
    required: true,
    maxFiles: 5,
    acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png']
  },
  {
    id: 'licenses',
    name: 'License Documentation',
    description: 'Builder\'s license, trade certifications, professional registrations',
    required: true,
    maxFiles: 10,
    acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png']
  },
  {
    id: 'portfolio',
    name: 'Reference Projects Portfolio',
    description: 'Photos and documentation of similar completed projects',
    required: false,
    maxFiles: 20,
    acceptedTypes: ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
  },
  {
    id: 'technical',
    name: 'Technical Proposals',
    description: 'Method statements, technical specifications, construction methodology',
    required: true,
    maxFiles: 10,
    acceptedTypes: ['.pdf', '.doc', '.docx', '.xls', '.xlsx']
  },
  {
    id: 'financial',
    name: 'Financial Documents',
    description: 'Bank guarantees, financial statements, bonding capacity',
    required: false,
    maxFiles: 5,
    acceptedTypes: ['.pdf', '.xls', '.xlsx']
  },
  {
    id: 'safety',
    name: 'Safety & Compliance',
    description: 'Safety management plans, WHS policies, environmental compliance',
    required: true,
    maxFiles: 8,
    acceptedTypes: ['.pdf', '.doc', '.docx']
  }
];

const DocumentUploadSystem: React.FC<DocumentUploadSystemProps> = ({
  categories = DEFAULT_CATEGORIES,
  onFilesUploaded,
  maxFileSize = 50,
  allowMultiple = true,
  className = ''
}) => {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="h-5 w-5 text-blue-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-5 w-5 text-green-600" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const validateFile = (file: File, category: DocumentCategory): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit`;
    }

    // Check file type
    const extension = '.' + file.name.toLowerCase().split('.').pop();
    if (!category.acceptedTypes.includes(extension)) {
      return `File type ${extension} not accepted for this category`;
    }

    // Check category file limit
    const categoryFiles = uploadedFiles.filter(f => f.category === category.id);
    if (categoryFiles.length >= category.maxFiles) {
      return `Maximum ${category.maxFiles} files allowed for this category`;
    }

    return null;
  };

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadedFiles(prev => prev.map(file => 
          file.id === fileId 
            ? { ...file, uploadProgress: 100, status: 'completed' }
            : file
        ));
      } else {
        setUploadedFiles(prev => prev.map(file => 
          file.id === fileId 
            ? { ...file, uploadProgress: progress }
            : file
        ));
      }
    }, 200);
  };

  const handleFileUpload = useCallback((files: FileList, categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    Array.from(files).forEach(file => {
      const validation = validateFile(file, category);
      if (validation) {
        toast({
          title: "Upload Error",
          description: validation,
          variant: "destructive"
        });
        return;
      }

      const fileId = Date.now().toString() + Math.random();
      const newFile: UploadedFile = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        category: categoryId,
        uploadProgress: 0,
        status: 'uploading',
        file
      };

      setUploadedFiles(prev => [...prev, newFile]);
      simulateUpload(fileId);
    });
  }, [categories, uploadedFiles, maxFileSize, toast]);

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleDrop = useCallback((e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    setDragActive(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files, categoryId);
      e.dataTransfer.clearData();
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    setDragActive(categoryId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(null);
  }, []);

  const getCategoryFiles = (categoryId: string) => {
    return uploadedFiles.filter(file => file.category === categoryId);
  };

  const getCategoryProgress = (categoryId: string) => {
    const files = getCategoryFiles(categoryId);
    if (files.length === 0) return 0;
    const totalProgress = files.reduce((sum, file) => sum + file.uploadProgress, 0);
    return totalProgress / files.length;
  };

  const getOverallProgress = () => {
    if (uploadedFiles.length === 0) return 0;
    const totalProgress = uploadedFiles.reduce((sum, file) => sum + file.uploadProgress, 0);
    return totalProgress / uploadedFiles.length;
  };

  const getCompletionStatus = () => {
    const requiredCategories = categories.filter(cat => cat.required);
    const completedRequired = requiredCategories.every(cat => 
      getCategoryFiles(cat.id).some(file => file.status === 'completed')
    );
    
    const totalRequired = requiredCategories.length;
    const completedCount = requiredCategories.filter(cat => 
      getCategoryFiles(cat.id).some(file => file.status === 'completed')
    ).length;

    return { completedRequired, totalRequired, completedCount };
  };

  const { completedRequired, totalRequired, completedCount } = getCompletionStatus();

  React.useEffect(() => {
    if (onFilesUploaded) {
      onFilesUploaded(uploadedFiles);
    }
  }, [uploadedFiles, onFilesUploaded]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Document Upload Progress
            </span>
            <Badge variant={completedRequired ? 'default' : 'secondary'}>
              {completedCount}/{totalRequired} Required Categories
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={getOverallProgress()} className="w-full" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{uploadedFiles.length} files uploaded</span>
              <span>{Math.round(getOverallProgress())}% complete</span>
            </div>
            {!completedRequired && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please upload at least one document in each required category to proceed.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Upload Areas */}
      <div className="grid md:grid-cols-2 gap-6">
        {categories.map((category) => {
          const categoryFiles = getCategoryFiles(category.id);
          const categoryProgress = getCategoryProgress(category.id);
          const hasCompleted = categoryFiles.some(file => file.status === 'completed');
          
          return (
            <Card key={category.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {category.name}
                    {category.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                    {hasCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                  </CardTitle>
                  <Badge variant="outline">
                    {categoryFiles.length}/{category.maxFiles}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{category.description}</p>
                {categoryFiles.length > 0 && (
                  <Progress value={categoryProgress} className="w-full" />
                )}
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-muted-foreground/50 ${
                    dragActive === category.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-muted-foreground/25'
                  }`}
                  onDrop={(e) => handleDrop(e, category.id)}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, category.id)}
                  onDragLeave={handleDragLeave}
                >
                  <input
                    type="file"
                    multiple={allowMultiple}
                    accept={category.acceptedTypes.join(',')}
                    onChange={(e) => e.target.files && handleFileUpload(e.target.files, category.id)}
                    className="hidden"
                    id={`upload-${category.id}`}
                  />
                  <label htmlFor={`upload-${category.id}`} className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Accepted: {category.acceptedTypes.join(', ')} • Max size: {maxFileSize}MB
                    </p>
                  </label>
                </div>

                {/* Uploaded Files */}
                {categoryFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.name)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <Badge 
                          variant={file.status === 'completed' ? 'default' : file.status === 'error' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {file.status === 'uploading' && `${Math.round(file.uploadProgress)}%`}
                          {file.status === 'completed' && 'Complete'}
                          {file.status === 'error' && 'Error'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {file.status === 'completed' && (
                            <>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Download className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="h-6 w-6 p-0 text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {file.status === 'uploading' && (
                        <Progress value={file.uploadProgress} className="w-full h-1 mt-1" />
                      )}
                    </div>
                  </div>
                ))}

                {categoryFiles.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No files uploaded yet
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{uploadedFiles.length}</div>
                <div className="text-muted-foreground">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {uploadedFiles.filter(f => f.status === 'completed').length}
                </div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(uploadedFiles.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024))}MB
                </div>
                <div className="text-muted-foreground">Total Size</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DocumentUploadSystem;
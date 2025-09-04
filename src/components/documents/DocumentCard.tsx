import React, { useState } from 'react';
import { 
  Download, 
  Eye, 
  MoreHorizontal, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  Image,
  File,
  GitBranch,
  MessageSquare,
  Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Document } from '@/hooks/useDocuments';
import { format } from 'date-fns';

interface DocumentCardProps {
  document: Document;
  onDownload: (filePath: string, fileName: string) => void;
  onDelete?: (documentId: string, filePath: string) => void;
  onStatusChange?: (documentId: string, status: Document['status']) => void;
  onRequestApproval?: (documentId: string) => void;
  onViewDetails?: (document: Document) => void;
  onPreview?: (document: Document) => void;
  canEdit: boolean;
  canApprove: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onDownload,
  onDelete,
  onStatusChange,
  onRequestApproval,
  onViewDetails,
  onPreview,
  canEdit,
  canApprove
}) => {
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-construction-info" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-8 w-8 text-destructive" />;
    } else {
      return <File className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-construction-success" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'under_review':
        return <Clock className="h-4 w-4 text-construction-warning" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'under_review': return 'secondary';
      case 'draft': return 'outline';
      default: return 'outline';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getFileIcon(document.file_type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-sm truncate pr-2">
                {document.name}
              </h3>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onPreview && (
                    <DropdownMenuItem onClick={() => onPreview(document)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem 
                    onClick={() => onDownload(document.file_path, document.name)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>

                  {onViewDetails && (
                    <DropdownMenuItem onClick={() => onViewDetails(document)}>
                      <GitBranch className="h-4 w-4 mr-2" />
                      Version History
                    </DropdownMenuItem>
                  )}
                  
                  {canEdit && document.status === 'draft' && onRequestApproval && (
                    <DropdownMenuItem 
                      onClick={() => onRequestApproval(document.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Request Approval
                    </DropdownMenuItem>
                  )}
                  
                  {canApprove && document.status === 'under_review' && onStatusChange && (
                    <>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(document.id, 'approved')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(document.id, 'rejected')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {canEdit && onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(document.id, document.file_path)}
                      className="text-destructive"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={getStatusColor(document.status)} className="text-xs">
                <span className="flex items-center gap-1">
                  {getStatusIcon(document.status)}
                  {document.status.replace('_', ' ')}
                </span>
              </Badge>
              
              {document.version && document.version > 1 && (
                <Badge variant="outline" className="text-xs">
                  v{document.version}
                </Badge>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-4">
                <span>{formatFileSize(document.file_size)}</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  3
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  2
                </span>
              </div>
              <div>
                Uploaded {format(new Date(document.created_at), 'MMM dd, yyyy')}
              </div>
              {document.updated_at !== document.created_at && (
                <div>
                  Updated {format(new Date(document.updated_at), 'MMM dd, yyyy')}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
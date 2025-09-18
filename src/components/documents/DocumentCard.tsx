import React from 'react';
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
import { DocumentGroup } from '@/hooks/useDocumentGroups';
import { format } from 'date-fns';

interface DocumentCardProps {
  documentGroup: DocumentGroup;
  onDownload: (groupId: string) => void;
  onDelete: (groupId: string) => Promise<boolean>;
  onStatusChange: (groupId: string, status: string) => Promise<void>;
  onTypeChange: (groupId: string, type: string) => Promise<void>;
  onPreview: (group: DocumentGroup) => void;
  onViewDetails: (group: DocumentGroup) => void;
  onViewActivity: (group: DocumentGroup) => void;
  onSupersede: (groupId: string, file: File, changesSummary?: string) => Promise<boolean>;
  canEdit: boolean;
  canApprove: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  documentGroup,
  onDownload,
  onDelete,
  onStatusChange,
  onTypeChange,
  onPreview,
  onViewDetails,
  onViewActivity,
  onSupersede,
  canEdit,
  canApprove
}) => {
  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <File className="h-8 w-8 text-muted-foreground" />;
    
    if (fileType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-construction-info" />;
    } else if (fileType === 'application/pdf') {
      return <FileText className="h-8 w-8 text-destructive" />;
    } else {
      return <File className="h-8 w-8 text-muted-foreground" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'For Construction':
        return <CheckCircle className="h-4 w-4 text-construction-success" />;
      case 'For Tender':
        return <Clock className="h-4 w-4 text-construction-warning" />;
      case 'For Information':
        return <FileText className="h-4 w-4 text-muted-foreground" />;
      default:
        return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'For Construction': return 'default';
      case 'For Tender': return 'secondary';
      case 'For Information': return 'outline';
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

  const currentRevision = documentGroup.current_revision;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {getFileIcon(currentRevision?.file_type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-sm truncate pr-2">
                {documentGroup.title}
              </h3>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onPreview(documentGroup)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => onDownload(documentGroup.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => onViewDetails(documentGroup)}>
                    <GitBranch className="h-4 w-4 mr-2" />
                    Version History
                  </DropdownMenuItem>
                  
                  {canApprove && (
                    <>
                      <DropdownMenuItem onClick={() => onStatusChange(documentGroup.id, 'For Tender')}>
                        <Clock className="h-4 w-4 mr-2" />
                        For Tender
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(documentGroup.id, 'For Information')}>
                        <FileText className="h-4 w-4 mr-2" />
                        For Information
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatusChange(documentGroup.id, 'For Construction')}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        For Construction
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {canEdit && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(documentGroup.id)}
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
              <Badge variant={getStatusColor(documentGroup.status)} className="text-xs">
                <span className="flex items-center gap-1">
                  {getStatusIcon(documentGroup.status)}
                  {documentGroup.status.replace('_', ' ')}
                </span>
              </Badge>
              
              {currentRevision && currentRevision.revision_number > 1 && (
                <Badge variant="outline" className="text-xs">
                  rev {currentRevision.revision_number}
                </Badge>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-4">
                <span>{formatFileSize(currentRevision?.file_size)}</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {/* TODO: Get actual collaborator count */}
                  1
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {/* TODO: Get actual comment count */}
                  0
                </span>
              </div>
              <div>
                {format(new Date(documentGroup.created_at), 'MMM dd, yyyy')}
              </div>
              {documentGroup.updated_at !== documentGroup.created_at && (
                <div>
                  Updated: {format(new Date(documentGroup.updated_at), 'MMM dd, yyyy')}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
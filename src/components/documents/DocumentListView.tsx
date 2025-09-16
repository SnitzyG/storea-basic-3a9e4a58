import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  Download, 
  Eye, 
  FileText, 
  History, 
  Edit, 
  Share, 
  Lock, 
  Unlock, 
  X,
  Upload,
  MessageSquare
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentGroup } from '@/hooks/useDocumentGroups';
import { SupersedeDocumentDialog } from './SupersedeDocumentDialog';
import { DocumentSharingDialog } from './DocumentSharingDialog';
import { EditDocumentDialog } from './EditDocumentDialog';
import { format } from 'date-fns';
import { FileTypeIcon } from './FileTypeIcon';
import { useAuth } from '@/hooks/useAuth';

interface DocumentListViewProps {
  documentGroups: DocumentGroup[];
  onDownload: (groupId: string) => void;
  onDelete: (groupId: string) => Promise<boolean>;
  onStatusChange: (groupId: string, status: string) => Promise<void>;
  onTypeChange: (groupId: string, type: string) => Promise<void>;
  onPreview: (group: DocumentGroup) => void;
  onViewDetails: (group: DocumentGroup) => void;
  onViewActivity: (group: DocumentGroup) => void;
  onSupersede: (groupId: string, file: File, changesSummary?: string) => Promise<boolean>;
  onToggleLock: (groupId: string, shouldLock: boolean) => Promise<boolean>;
  onEdit: (groupId: string, updates: any) => Promise<boolean>;
  canEdit: boolean;
  canApprove: boolean;
  selectedProject: string;
}

export const DocumentListView: React.FC<DocumentListViewProps> = ({
  documentGroups,
  onDownload,
  onDelete,
  onStatusChange,
  onTypeChange,
  onPreview,
  onViewDetails,
  onViewActivity,
  onSupersede,
  onToggleLock,
  onEdit,
  canEdit,
  canApprove,
  selectedProject
}) => {
  const { profile } = useAuth();
  const [supersedeDocument, setSupersedeDocument] = useState<DocumentGroup | null>(null);
  const [isSupersedeDialogOpen, setIsSupersedeDialogOpen] = useState(false);
  const [shareDocument, setShareDocument] = useState<DocumentGroup | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [editDocument, setEditDocument] = useState<DocumentGroup | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleSupersede = (group: DocumentGroup) => {
    setSupersedeDocument(group);
    setIsSupersedeDialogOpen(true);
  };

  const handleShareDocument = (group: DocumentGroup) => {
    setShareDocument(group);
    setIsShareDialogOpen(true);
  };

  const handleViewHistory = (group: DocumentGroup) => {
    onViewDetails(group);
  };

  const handleEditDocument = (group: DocumentGroup) => {
    setEditDocument(group);
    setIsEditDialogOpen(true);
  };

  const handleDeleteConfirm = async (group: DocumentGroup) => {
    if (confirm(`Are you sure you want to delete "${group.title}"?`)) {
      await onDelete(group.id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'For Construction':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'For Tender':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'For Information':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] cursor-pointer hover:bg-muted/50">Type</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50">Document</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50">Number</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50">Category</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50">Status</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50">Size</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50">Rev</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50">Uploaded By</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50">Created</TableHead>
            <TableHead className="cursor-pointer hover:bg-muted/50">Updated</TableHead>
            <TableHead>Lock</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documentGroups.map((group) => (
            <TableRow key={group.id} className="hover:bg-muted/50">
              <TableCell>
                <FileTypeIcon 
                  fileName={group.current_revision?.file_name || ''} 
                  className="h-6 w-6" 
                />
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium text-sm leading-none">
                    {group.title}
                  </p>
                  {group.current_revision?.file_name && (
                    <p className="text-xs text-muted-foreground">
                      {group.current_revision.file_name}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {group.document_number || '-'}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {group.category}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={`text-xs ${getStatusColor(group.status)}`}>
                  {group.status}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatFileSize(group.current_revision?.file_size)}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="text-xs font-mono">
                  {group.current_revision?.revision_number || 1}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {group.current_revision?.uploaded_by_name || 'Unknown'}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(group.created_at), 'MMM dd, yyyy HH:mm.ss')}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {group.updated_at !== group.created_at 
                  ? format(new Date(group.updated_at), 'MMM dd, yyyy HH:mm.ss')
                  : '-'
                }
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleLock(group.id, !group.is_locked)}
                  className="h-8 w-8 p-0"
                >
                  {group.is_locked ? (
                    <Lock className="h-4 w-4" />
                  ) : (
                    <Unlock className="h-4 w-4" />
                  )}
                </Button>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border">
                    <DropdownMenuItem onClick={() => onPreview(group)}>
                      <Eye className="h-3 w-3 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => onDownload(group.id)}>
                      <Download className="h-3 w-3 mr-2" />
                      Download
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleViewHistory(group)}>
                      <History className="h-3 w-3 mr-2" />
                      Revision History
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => onViewActivity(group)}>
                      <MessageSquare className="h-3 w-3 mr-2" />
                      Activity
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                     {canEdit && (
                       <DropdownMenuItem 
                         onClick={() => handleSupersede(group)}
                         disabled={group.is_locked}
                       >
                         <Upload className="h-3 w-3 mr-2" />
                         Supersede
                       </DropdownMenuItem>
                     )}
                    
                    {(group.visibility_scope === 'private' || group.created_by === profile?.user_id) && (
                      <DropdownMenuItem onClick={() => handleShareDocument(group)}>
                        <Share className="h-3 w-3 mr-2" />
                        Share
                      </DropdownMenuItem>
                    )}

                     {canEdit && (
                       <DropdownMenuItem 
                         onClick={() => handleEditDocument(group)}
                         disabled={group.is_locked}
                       >
                         <Edit className="h-3 w-3 mr-2" />
                         Edit
                       </DropdownMenuItem>
                     )}
                     
                     {canEdit && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteConfirm(group)} 
                          disabled={group.is_locked}
                          className="text-destructive"
                        >
                          <X className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {documentGroups.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileTypeIcon fileName="document.pdf" className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No documents found</p>
          <p className="text-sm">Upload your first document to get started</p>
        </div>
      )}

      {/* Supersede Dialog */}
      <SupersedeDocumentDialog
        document={supersedeDocument}
        isOpen={isSupersedeDialogOpen}
        onClose={() => setIsSupersedeDialogOpen(false)}
        onSupersede={async (groupId, file, summary) => {
          const success = await onSupersede(groupId, file, summary);
          if (success) {
            setIsSupersedeDialogOpen(false);
            setSupersedeDocument(null);
          }
          return success;
        }}
      />

      {/* Share Dialog */}
      <DocumentSharingDialog
        document={shareDocument as any}
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        projectId={selectedProject === 'all' ? undefined : selectedProject}
      />

      {/* Edit Dialog */}
      <EditDocumentDialog
        document={editDocument}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditDocument(null);
        }}
        onSave={async (groupId, updates) => {
          const success = await onEdit(groupId, updates);
          if (success) {
            setIsEditDialogOpen(false);
            setEditDocument(null);
          }
          return success;
        }}
      />
    </div>
  );
};
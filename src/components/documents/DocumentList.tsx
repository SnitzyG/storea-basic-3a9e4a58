import React, { useState } from 'react';
import { Eye, Download, Edit, Share, Trash2, Lock, Unlock, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { FileTypeIcon } from './FileTypeIcon';
import { formatFileSize } from '@/utils/documentUtils';

interface DocumentRec {
  id: string;
  title?: string;
  name?: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  status?: string;
  category?: string;
  version?: number;
  created_at: string;
  updated_at: string;
  uploaded_by: string;
  is_locked?: boolean;
  visibility_scope?: string;
}

interface DocumentListProps {
  documents: DocumentRec[];
  loading?: boolean;
  viewMode: 'grid' | 'list';
  onPreview?: (doc: DocumentRec) => void;
  onDelete?: (id: string, filePath?: string) => void;
  onHistory?: (doc: DocumentRec) => void;
  selectedProject?: string;
  onUpload?: () => void;
}

export const DocumentList = ({
  documents,
  loading = false,
  viewMode,
  onPreview,
  onDelete,
  onHistory,
  selectedProject,
  onUpload
}: DocumentListProps) => {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const handleDelete = async (doc: DocumentRec) => {
    if (!onDelete) return;
    
    setDeletingIds(prev => new Set([...prev, doc.id]));
    try {
      await onDelete(doc.id, doc.file_path);
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(doc.id);
        return newSet;
      });
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'superseded': return 'bg-orange-100 text-orange-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <div className="w-8 h-8 bg-muted rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
            </div>
            <div className="w-20 h-6 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <FileTypeIcon fileName="document.pdf" className="h-16 w-16 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium mb-2">No documents found</h3>
        <p className="text-muted-foreground mb-4">
          {selectedProject ? "This project doesn't have any documents yet." : "Start by uploading some documents."}
        </p>
        {onUpload && (
          <Button onClick={onUpload}>
            Upload Documents
          </Button>
        )}
      </div>
    );
  }

  // Always render table view as requested
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">Type</TableHead>
            <TableHead className="w-12">Lock</TableHead>
            <TableHead className="min-w-[200px]">Title</TableHead>
            <TableHead className="w-32">Category</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-16">Version</TableHead>
            <TableHead className="w-24">Size</TableHead>
            <TableHead className="w-32">Created</TableHead>
            <TableHead className="w-32">Updated</TableHead>
            <TableHead className="w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id} className="hover:bg-muted/50">
              <TableCell>
                <FileTypeIcon 
                  fileName={document.name || document.file_path} 
                  fileType={document.file_type} 
                />
              </TableCell>
              
              <TableCell>
                <div className="flex items-center">
                  {document.is_locked ? (
                    <Lock className="h-4 w-4 text-destructive" />
                  ) : (
                    <Unlock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </TableCell>
              
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span className="truncate">{document.title || document.name}</span>
                  {document.visibility_scope === 'private' && (
                    <Badge variant="secondary" className="text-xs">Private</Badge>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {document.category || 'General'}
                </Badge>
              </TableCell>
              
              <TableCell>
                {document.status && (
                  <Badge className={`text-xs ${getStatusColor(document.status)}`}>
                    {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                  </Badge>
                )}
              </TableCell>
              
              <TableCell className="font-mono text-center">
                v{document.version || 1}
              </TableCell>
              
              <TableCell className="text-xs text-muted-foreground">
                {formatFileSize(document.file_size)}
              </TableCell>
              
              <TableCell className="text-xs text-muted-foreground">
                {formatDate(document.created_at)}
              </TableCell>
              
              <TableCell className="text-xs text-muted-foreground">
                {formatDate(document.updated_at)}
              </TableCell>
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onPreview && (
                      <DropdownMenuItem onClick={() => onPreview(document)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    {onHistory && (
                      <DropdownMenuItem onClick={() => onHistory(document)}>
                        <Eye className="mr-2 h-4 w-4" />
                        History
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => handleDelete(document)}
                        disabled={deletingIds.has(document.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {deletingIds.has(document.id) ? 'Deleting...' : 'Delete'}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
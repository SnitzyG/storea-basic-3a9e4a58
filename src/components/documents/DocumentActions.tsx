import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, Eye, Download, Edit, Share, 
  Trash2, Archive, Copy, Star 
} from 'lucide-react';

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

interface DocumentActionsProps {
  document: DocumentRec;
  onPreview?: (doc: DocumentRec) => void;
  onDownload?: (doc: DocumentRec) => void;
  onEdit?: (doc: DocumentRec) => void;
  onDelete?: (doc: DocumentRec) => void;
  onShare?: (doc: DocumentRec) => void;
  onArchive?: (doc: DocumentRec) => void;
  compact?: boolean;
}

export const DocumentActions = ({
  document,
  onPreview,
  onDownload,
  onEdit,
  onDelete,
  onShare,
  onArchive,
  compact = false
}: DocumentActionsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(document);
    } finally {
      setIsDeleting(false);
    }
  };

  if (compact) {
    return (
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
          {onDownload && (
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(document)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Details
            </DropdownMenuItem>
          )}
          {onShare && (
            <DropdownMenuItem onClick={() => onShare(document)}>
              <Share className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          {onArchive && (
            <DropdownMenuItem onClick={() => onArchive(document)}>
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem 
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex gap-1">
      {onPreview && (
        <Button variant="ghost" size="sm" onClick={() => onPreview(document)}>
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {onDownload && (
        <Button variant="ghost" size="sm" onClick={() => onDownload(document)}>
          <Download className="h-4 w-4" />
        </Button>
      )}
      {onEdit && (
        <Button variant="ghost" size="sm" onClick={() => onEdit(document)}>
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {onDelete && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileX, Archive, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Document } from '@/hooks/useDocuments';

interface DocumentDeleteConfirmDialogProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (documentId: string, filePath: string) => void;
}

interface DocumentVersion {
  id: string;
  version_number: number;
  file_path: string;
  created_at: string;
}

export const DocumentDeleteConfirmDialog: React.FC<DocumentDeleteConfirmDialogProps> = ({
  document,
  isOpen,
  onClose,
  onConfirmDelete
}) => {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && document) {
      loadVersions();
    }
  }, [isOpen, document]);

  const loadVersions = async () => {
    if (!document) return;

    try {
      const { data } = await supabase
        .from('document_versions')
        .select('id, version_number, file_path, created_at')
        .eq('document_id', document.id)
        .order('version_number', { ascending: false });

      setVersions(data || []);
    } catch (error) {
      console.error('Error loading versions:', error);
      setVersions([]);
    }
  };

  const handleDelete = () => {
    if (!document) return;
    setLoading(true);
    onConfirmDelete(document.id, document.file_path);
  };

  if (!document) return null;

  const versionCount = versions.length;
  const totalVersions = versionCount + 1; // Current version + archived versions

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Document?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <div className="text-left">
              <p className="font-medium text-foreground mb-2">
                {document.title || document.name}
              </p>
              
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Trash2 className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-destructive mb-1">
                          Permanent Deletion
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          This action will <strong>permanently delete</strong> this document and <strong>all {totalVersions} version{totalVersions !== 1 ? 's' : ''}</strong> from the system.
                        </p>
                      </div>
                      
                      {versionCount > 0 && (
                        <div className="pt-2 border-t border-destructive/20">
                          <p className="text-xs text-muted-foreground">
                            <strong>Versions to be deleted:</strong>
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Current ({document.version ? String.fromCharCode(64 + document.version) : 'A'})
                            </Badge>
                            {versions.map((version) => (
                              <Badge key={version.id} variant="outline" className="text-xs">
                                Rev {String.fromCharCode(64 + version.version_number)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-4 p-3 bg-muted/50 rounded border border-dashed">
                <div className="flex items-start gap-2">
                  <Archive className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Alternative: Supersede Document</p>
                    <p className="text-xs text-muted-foreground">
                      If you want to replace this document while keeping history, use "Supersede" instead. This preserves all versions for audit purposes.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                <strong>Warning:</strong> This action cannot be undone. All file data and version history will be permanently lost.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={loading}
          >
            <FileX className="h-4 w-4 mr-2" />
            {loading ? 'Deleting...' : 'Delete Forever'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
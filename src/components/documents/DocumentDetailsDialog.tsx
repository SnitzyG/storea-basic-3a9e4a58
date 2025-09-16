import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, User, Download, GitBranch } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentVersionHistory } from './DocumentVersionHistory';
import { DocumentGroup, DocumentRevision, useDocumentGroups } from '@/hooks/useDocumentGroups';
import { format } from 'date-fns';

interface DocumentDetailsDialogProps {
  document: DocumentGroup | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentDetailsDialog: React.FC<DocumentDetailsDialogProps> = ({
  document,
  isOpen,
  onClose
}) => {
  const { getDocumentRevisions } = useDocumentGroups();
  const [revisions, setRevisions] = useState<DocumentRevision[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (document && isOpen) {
      loadRevisions();
    }
  }, [document, isOpen]);

  const loadRevisions = async () => {
    if (!document) return;
    setLoading(true);
    try {
      const revisionsData = await getDocumentRevisions(document.id);
      setRevisions(revisionsData);
    } catch (error) {
      console.error('Error loading revisions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadRevision = async (revision: DocumentRevision) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(revision.file_path, 60 * 60); // 1 hour
      
      if (error || !data?.signedUrl) {
        const { data: pub } = supabase.storage
          .from('documents')
          .getPublicUrl(revision.file_path);
        
        const link = window.document.createElement('a');
        link.href = pub.publicUrl;
        link.download = revision.file_name || 'document';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      } else {
        const link = window.document.createElement('a');
        link.href = data.signedUrl;
        link.download = revision.file_name || 'document';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!document) return null;

  const currentRevision = document.current_revision;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <div>
                <DialogTitle className="text-xl">{document.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  {currentRevision && (
                    <Badge variant="outline">
                      Rev {currentRevision.revision_number}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {document.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => currentRevision && handleDownloadRevision(currentRevision)}
              disabled={!currentRevision}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <Tabs defaultValue="versions" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="versions">Version History</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 min-h-0 pt-4">
              <TabsContent value="versions" className="h-full">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-muted-foreground">Loading revisions...</div>
                  </div>
                ) : (
                  <div className="space-y-4 h-full overflow-auto">
                    {revisions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No revisions found</h3>
                        <p className="text-muted-foreground">
                          This document has no revision history
                        </p>
                      </div>
                    ) : (
                      revisions.map((revision) => (
                        <div key={revision.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={revision.is_current ? "default" : "outline"}>
                                Rev {revision.revision_number}
                              </Badge>
                              {revision.is_current && (
                                <Badge variant="secondary" className="text-xs">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadRevision(revision)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <h4 className="font-medium mb-1">{revision.file_name}</h4>
                          
                          {revision.changes_summary && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {revision.changes_summary}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {revision.uploaded_by_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(revision.created_at), 'MMM dd, yyyy HH:mm')}
                            </span>
                            {revision.file_size && (
                              <span>
                                {(revision.file_size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
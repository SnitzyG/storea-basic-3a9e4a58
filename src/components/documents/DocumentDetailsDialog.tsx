import React, { useState, useEffect } from 'react';
import { X, FileText, Calendar, User, Download, GitBranch } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentVersionHistory } from './DocumentVersionHistory';
import { DocumentComments } from './DocumentComments';
import { DocumentCollaboration } from './DocumentCollaboration';
import { DocumentAnalytics } from './DocumentAnalytics';
import { Document, DocumentVersion, useDocuments } from '@/hooks/useDocuments';
import { format } from 'date-fns';
interface DocumentDetailsDialogProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
}
export const DocumentDetailsDialog: React.FC<DocumentDetailsDialogProps> = ({
  document,
  isOpen,
  onClose
}) => {
  const {
    downloadDocument,
    getDocumentVersions,
    revertToVersion
  } = useDocuments();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (document && isOpen) {
      loadVersions();
    }
  }, [document, isOpen]);
  const loadVersions = async () => {
    if (!document) return;
    setLoading(true);
    try {
      const versionsData = await getDocumentVersions(document.id);
      setVersions(versionsData);
    } catch (error) {
      console.error('Error loading versions:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleRevertToVersion = async (versionId: string) => {
    if (!document) return;
    await revertToVersion(document.id, versionId);
    await loadVersions();
  };
  const handleAddComment = async (content: string, type: 'comment' | 'suggestion' | 'approval') => {
    // TODO: Implement comment creation
    console.log('Adding comment:', {
      content,
      type
    });
  };
  if (!document) return null;

  // Mock data for demo
  const mockComments = [{
    id: '1',
    user_id: 'user1',
    user_name: 'John Doe',
    content: 'This looks great! Just a few minor adjustments needed.',
    created_at: new Date().toISOString(),
    type: 'comment' as const
  }];
  const mockCollaborators = [{
    user_id: 'user1',
    user_name: 'John Doe',
    is_online: true,
    last_activity: new Date().toISOString(),
    current_action: 'viewing' as const
  }, {
    user_id: 'user2',
    user_name: 'Jane Smith',
    is_online: false,
    last_activity: new Date(Date.now() - 86400000).toISOString()
  }];
  const mockAnalytics = {
    views: 42,
    downloads: 12,
    collaborators: 5,
    versions: versions.length || 1,
    avgTimeSpent: '8m 30s',
    popularActions: [{
      action: 'view',
      count: 25,
      percentage: 60
    }, {
      action: 'download',
      count: 12,
      percentage: 29
    }, {
      action: 'comment',
      count: 5,
      percentage: 11
    }]
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <div>
                <DialogTitle className="text-xl">{document.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">
                    v{document.version || 1}
                  </Badge>
                  <Badge variant="secondary">
                    {document.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
            
            <Button variant="outline" onClick={() => downloadDocument(document.file_path, document.name)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0">
          <Tabs defaultValue="versions" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="versions">Version History</TabsTrigger>
              
              
              
            </TabsList>
            
            <div className="flex-1 min-h-0 pt-4">
              <TabsContent value="versions" className="h-full">
                <DocumentVersionHistory documentId={document.id} versions={versions} onDownloadVersion={downloadDocument} onRevertToVersion={handleRevertToVersion} currentVersion={document.version} />
              </TabsContent>

              <TabsContent value="comments" className="h-full">
                <DocumentComments documentId={document.id} comments={mockComments} onAddComment={handleAddComment} />
              </TabsContent>

              <TabsContent value="collaboration" className="h-full">
                <DocumentCollaboration documentId={document.id} collaborators={mockCollaborators} currentUserId="current-user" />
              </TabsContent>

              <TabsContent value="analytics" className="h-full">
                <DocumentAnalytics documentId={document.id} data={mockAnalytics} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>;
};
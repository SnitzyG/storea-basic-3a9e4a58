import React, { useState, useEffect } from 'react';
import { 
  History, 
  Clock, 
  User, 
  Eye, 
  Edit, 
  Download, 
  Share, 
  FileText, 
  Archive,
  GitBranch,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Document } from '@/hooks/useDocuments';
import { useDocumentHistory, DocumentHistoryItem, DocumentRevision } from '@/hooks/useDocumentHistory';

interface DocumentHistoryDialogProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (filePath: string, fileName: string) => void;
}

export const DocumentHistoryDialog: React.FC<DocumentHistoryDialogProps> = ({
  document,
  isOpen,
  onClose,
  onDownload
}) => {
  const [activities, setActivities] = useState<DocumentHistoryItem[]>([]);
  const [revisions, setRevisions] = useState<DocumentRevision[]>([]);
  const { getDocumentHistory, getDocumentRevisions, loading: historyLoading } = useDocumentHistory();

  useEffect(() => {
    if (isOpen && document) {
      loadData();
    }
  }, [isOpen, document]);

  const loadData = async () => {
    if (!document) return;

    try {
      const [historyData, revisionsData] = await Promise.all([
        getDocumentHistory(document.id),
        getDocumentRevisions(document.id)
      ]);
      setActivities(historyData);
      setRevisions(revisionsData);
    } catch (error) {
      console.error('Error loading document history data:', error);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'created': return <FileText className="h-4 w-4 text-green-500" />;
      case 'viewed': return <Eye className="h-4 w-4 text-blue-500" />;
      case 'edited': return <Edit className="h-4 w-4 text-orange-500" />;
      case 'downloaded': return <Download className="h-4 w-4 text-purple-500" />;
      case 'shared': return <Share className="h-4 w-4 text-cyan-500" />;
      case 'version_created': return <GitBranch className="h-4 w-4 text-indigo-500" />;
      case 'superseded': return <Archive className="h-4 w-4 text-red-500" />;
      case 'archived': return <Archive className="h-4 w-4 text-gray-500" />;
      case 'reverted': return <RotateCcw className="h-4 w-4 text-yellow-500" />;
      case 'transmitted': return <Share className="h-4 w-4 text-teal-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActivityTitle = (type: string) => {
    switch (type) {
      case 'created': return 'Document Created';
      case 'viewed': return 'Document Viewed';
      case 'edited': return 'Document Edited';
      case 'downloaded': return 'Document Downloaded';
      case 'shared': return 'Document Shared';
      case 'version_created': return 'Document Superseded';
      case 'superseded': return 'Document Superseded';
      case 'archived': return 'Document Archived';
      case 'reverted': return 'Reverted to Previous Version';
      case 'transmitted': return 'Document Transmitted';
      default: return 'Activity';
    }
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Document History: {document.title || document.name}
          </DialogTitle>
        </DialogHeader>

        <div className="h-full flex flex-col">
          <Tabs defaultValue="revisions" className="flex-1 mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="revisions" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                Document Revisions ({revisions.length})
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Activity Timeline ({activities.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="revisions" className="mt-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {revisions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No document revisions found</p>
                    </div>
                  ) : (
                    revisions.map((revision, index) => (
                      <Card key={revision.id} className={`relative ${revision.is_current ? 'ring-2 ring-primary' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              <GitBranch className={`h-4 w-4 ${revision.is_current ? 'text-primary' : 'text-muted-foreground'}`} />
                              {index < revisions.length - 1 && (
                                <div className="w-px h-8 bg-border mt-2" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium">
                                    Revision {String.fromCharCode(64 + revision.version_number)}
                                  </h4>
                                  {revision.is_current && (
                                    <Badge variant="default" className="text-xs">
                                      Current
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(revision.created_at), 'MMM dd, yyyy HH:mm')}
                                </div>
                              </div>
                              
                              {revision.changes_summary && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {revision.changes_summary}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{revision.uploaded_by_name}</span>
                                  </div>
                                  
                                  {revision.file_size && (
                                    <span className="text-xs text-muted-foreground">
                                      {(revision.file_size / 1024 / 1024).toFixed(2)} MB
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {!revision.is_current && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-xs"
                                      onClick={() => {
                                        // TODO: Implement revert functionality
                                        console.log('Revert to version:', revision.version_number);
                                      }}
                                    >
                                      <RotateCcw className="h-3 w-3 mr-1" />
                                      Revert
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDownload?.(
                                      revision.file_path, 
                                      revision.file_name || 'document'
                                    )}
                                    className="text-xs"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="activity" className="mt-4">
              <ScrollArea className="h-[500px]">
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No activity history available</p>
                    </div>
                  ) : (
                    activities.map((activity, index) => (
                      <Card key={activity.id} className="relative">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center">
                              {getActivityIcon(activity.type)}
                              {index < activities.length - 1 && (
                                <div className="w-px h-8 bg-border mt-2" />
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{getActivityTitle(activity.type)}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(activity.timestamp), 'MMM dd, yyyy HH:mm')}
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-2">
                                {activity.details}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{activity.user_name}</span>
                                  </div>
                                  
                                  {activity.version && (
                                    <Badge variant="outline" className="text-xs">
                                      Rev {String.fromCharCode(64 + activity.version)}
                                    </Badge>
                                  )}
                                </div>
                                
                                {activity.metadata?.file_path && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDownload?.(
                                      activity.metadata?.file_path || '', 
                                      activity.metadata?.file_name || 'document'
                                    )}
                                    className="text-xs"
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
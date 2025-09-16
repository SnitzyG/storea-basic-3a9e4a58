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
  ChevronRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { Document } from '@/hooks/useDocuments';
import { useDocumentHistory } from '@/hooks/useDocumentHistory';
import { useDocumentVersions } from '@/hooks/useDocumentVersions';

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
  const [activities, setActivities] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [supersededDocs, setSupersededDocs] = useState<any[]>([]);
  const { getDocumentHistory, getSupersededDocuments, loading: historyLoading } = useDocumentHistory();
  const { getVersions, revertToVersion, loading: versionsLoading } = useDocumentVersions();

  useEffect(() => {
    if (isOpen && document) {
      loadData();
    }
  }, [isOpen, document]);

  const loadData = async () => {
    if (!document) return;

    try {
      const [historyData, versionsData, supersededData] = await Promise.all([
        getDocumentHistory(document.id),
        getVersions(document.id),
        getSupersededDocuments(document.project_id)
      ]);

      setActivities(historyData);
      setVersions(versionsData);
      setSupersededDocs(supersededData);
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

  const handleRevertToVersion = async (versionId: string) => {
    if (!document) return;
    
    const success = await revertToVersion(document.id, versionId);
    if (success) {
      await loadData(); // Reload data to show updated history
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

        <Tabs defaultValue="activity" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
            <TabsTrigger value="versions">Version History</TabsTrigger>
            <TabsTrigger value="archive">Archive</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="flex-1 mt-4">
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
                                    activity.metadata.file_path, 
                                    activity.metadata.file_name || 'document'
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

          <TabsContent value="versions" className="flex-1 mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {versions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No version history available</p>
                  </div>
                ) : (
                  versions.map((version, index) => (
                    <Card key={version.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${
                              version.version_number === document.version 
                                ? 'bg-primary' 
                                : 'bg-muted-foreground/30'
                            }`} />
                            {index < versions.length - 1 && (
                              <div className="w-px h-8 bg-border mt-2" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={
                                  version.version_number === document.version ? 'default' : 'outline'
                                }>
                                  Rev {String.fromCharCode(64 + version.version_number)}
                                </Badge>
                                {version.version_number === document.version && (
                                  <Badge variant="secondary" className="text-xs">Current</Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onDownload?.(
                                    version.file_path, 
                                    `${String.fromCharCode(64 + version.version_number)}-${document.name}`
                                  )}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                {version.version_number !== document.version && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRevertToVersion(version.id)}
                                    disabled={versionsLoading}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-2">
                              {version.changes_summary || 'No description provided'}
                            </p>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{format(new Date(version.created_at), 'MMM dd, yyyy HH:mm')}</span>
                              <Separator orientation="vertical" className="h-3" />
                              <User className="h-3 w-3" />
                              <span>Version {version.version_number}</span>
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

          <TabsContent value="archive" className="flex-1 mt-4">
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {supersededDocs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No archived documents</p>
                  </div>
                ) : (
                  supersededDocs.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{doc.title || doc.name}</h4>
                              <Badge variant="outline" className="text-xs">Superseded</Badge>
                              {doc.version && (
                                <Badge variant="secondary" className="text-xs">
                                  Rev {String.fromCharCode(64 + doc.version)}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Superseded on {format(new Date(doc.updated_at), 'MMM dd, yyyy')}</span>
                              {doc.superseded_by_document && (
                                <>
                                  <ChevronRight className="h-3 w-3" />
                                  <span>Replaced by: {doc.superseded_by_document.title || doc.superseded_by_document.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDownload?.(doc.file_path, doc.name)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDownload?.(doc.file_path, doc.name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
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
      </DialogContent>
    </Dialog>
  );
};
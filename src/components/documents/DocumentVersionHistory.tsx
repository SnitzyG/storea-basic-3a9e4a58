import React, { useState, useEffect } from 'react';
import { Clock, User, Download, GitBranch, Tag, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { DocumentVersion } from '@/hooks/useDocuments';

interface DocumentVersionHistoryProps {
  documentId: string;
  versions: DocumentVersion[];
  onDownloadVersion: (filePath: string, fileName: string) => void;
  onRevertToVersion: (versionId: string) => void;
  currentVersion?: number;
}

export const DocumentVersionHistory: React.FC<DocumentVersionHistoryProps> = ({
  documentId,
  versions,
  onDownloadVersion,
  onRevertToVersion,
  currentVersion
}) => {
  const getVersionIcon = (version: DocumentVersion) => {
    if (version.version_number === currentVersion) {
      return <div className="w-2 h-2 rounded-full bg-primary" />;
    }
    return <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />;
  };

  const getVersionLabel = (version: DocumentVersion) => {
    if (version.version_number === currentVersion) {
      return 'Current';
    }
    return `v${version.version_number}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Version History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {versions.map((version, index) => (
              <div key={version.id}>
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    {getVersionIcon(version)}
                    {index < versions.length - 1 && (
                      <div className="w-px h-8 bg-muted-foreground/20 mt-2" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={version.version_number === currentVersion ? 'default' : 'outline'}>
                          {getVersionLabel(version)}
                        </Badge>
                        {version.changes_summary && (
                          <span className="text-sm text-muted-foreground truncate">
                            {version.changes_summary}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownloadVersion(version.file_path, `v${version.version_number}.pdf`)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {version.version_number !== currentVersion && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onRevertToVersion(version.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(version.created_at), 'MMM dd, yyyy HH:mm')}</span>
                      <Separator orientation="vertical" className="h-3" />
                      <User className="h-3 w-3" />
                      <span>User {version.uploaded_by.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
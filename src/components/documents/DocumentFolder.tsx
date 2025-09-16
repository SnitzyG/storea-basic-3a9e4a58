import React, { useState } from 'react';
import { Folder, FolderOpen, File, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DocumentGroup } from '@/hooks/useDocumentGroups';
import { DocumentCard } from './DocumentCard';

interface DocumentFolderProps {
  title: string;
  documentGroups: DocumentGroup[];
  onUpload?: () => void;
  onDownload: (groupId: string) => void;
  onDelete: (groupId: string) => Promise<boolean>;
  onStatusChange: (groupId: string, status: string) => Promise<void>;
  onTypeChange: (groupId: string, type: string) => Promise<void>;
  onViewDetails: (group: DocumentGroup) => void;
  onPreview: (group: DocumentGroup) => void;
  onViewActivity: (group: DocumentGroup) => void;
  onSupersede: (groupId: string, file: File, changesSummary?: string) => Promise<boolean>;
  canEdit: boolean;
  canApprove: boolean;
  viewMode: 'grid' | 'list';
  defaultExpanded?: boolean;
}

export const DocumentFolder: React.FC<DocumentFolderProps> = ({
  title,
  documentGroups,
  onUpload,
  onDownload,
  onDelete,
  onStatusChange,
  onTypeChange,
  onViewDetails,
  onPreview,
  onViewActivity,
  onSupersede,
  canEdit,
  canApprove,
  viewMode,
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  const documentCount = documentGroups.length;
  const constructionCount = documentGroups.filter(doc => doc.status === 'For Construction').length;
  const tenderCount = documentGroups.filter(doc => doc.status === 'For Tender').length;

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <FolderOpen className="h-5 w-5 text-construction-warning" />
            ) : (
              <Folder className="h-5 w-5 text-construction-warning" />
            )}
            <h3 className="font-medium">{title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {documentCount}
              </Badge>
              {constructionCount > 0 && (
                <Badge variant="default" className="text-xs">
                  {constructionCount} construction
                </Badge>
              )}
              {tenderCount > 0 && (
                <Badge variant="outline" className="text-xs">
                  {tenderCount} tender
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onUpload && canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpload();
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? 'Collapse' : 'Expand'}
                </DropdownMenuItem>
                {onUpload && (
                  <DropdownMenuItem onClick={onUpload}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isExpanded && documentGroups.length > 0 && (
          <div className="mt-4">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documentGroups.map((group) => (
                  <DocumentCard
                    key={group.id}
                    documentGroup={group}
                    onDownload={onDownload}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                    onTypeChange={onTypeChange}
                    onViewDetails={onViewDetails}
                    onPreview={onPreview}
                    onViewActivity={onViewActivity}
                    onSupersede={onSupersede}
                    canEdit={canEdit}
                    canApprove={canApprove}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {documentGroups.map((group) => (
                  <DocumentCard
                    key={group.id}
                    documentGroup={group}
                    onDownload={onDownload}
                    onDelete={onDelete}
                    onStatusChange={onStatusChange}
                    onTypeChange={onTypeChange}
                    onViewDetails={onViewDetails}
                    onPreview={onPreview}
                    onViewActivity={onViewActivity}
                    onSupersede={onSupersede}
                    canEdit={canEdit}
                    canApprove={canApprove}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {isExpanded && documentGroups.length === 0 && (
          <div className="mt-4 text-center py-8 text-muted-foreground">
            <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents in this folder</p>
            {onUpload && canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={onUpload}
              >
                <Plus className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
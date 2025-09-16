import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { DocumentCard } from './DocumentCard';
import { DocumentGroup } from '@/hooks/useDocumentGroups';

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
  canEdit,
  canApprove,
  selectedProject
}) => {
  return (
    <div className="space-y-4">
      {documentGroups.length === 0 ? (
        <div className="text-center py-12">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No documents found</h3>
          <p className="text-muted-foreground">Upload your first document to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentGroups.map((group) => (
            <DocumentCard
              key={group.id}
              documentGroup={group}
              onDownload={onDownload}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onTypeChange={onTypeChange}
              onPreview={onPreview}
              onViewDetails={onViewDetails}
              onViewActivity={onViewActivity}
              onSupersede={onSupersede}
              canEdit={canEdit}
              canApprove={canApprove}
            />
          ))}
        </div>
      )}
    </div>
  );
};
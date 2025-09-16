import React, { useState, useMemo } from 'react';
import { Lock, Unlock, Eye, Clock, MoreHorizontal, Download, Edit, X, ArrowUpDown, ArrowUp, ArrowDown, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DocumentGroup } from '@/hooks/useDocumentGroups';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { FileTypeIcon } from './FileTypeIcon';
import { EditDocumentDialog } from './EditDocumentDialog';
import { DocumentSharingDialog } from './DocumentSharingDialog';
import { DocumentHistoryDialog } from './DocumentHistoryDialog';
import { SupersedeDocumentDialog } from './SupersedeDocumentDialog';
import { DocumentDeleteConfirmDialog } from './DocumentDeleteConfirmDialog';

interface DocumentListViewProps {
  documentGroups: DocumentGroup[];
  onDownload: (filePath: string, fileName: string) => void;
  onDelete?: (groupId: string) => void;
  onStatusChange?: (groupId: string, status: string) => void;
  onTypeChange?: (groupId: string, type: string) => void;
  onAccessibilityChange?: (groupId: string, accessibility: string) => void;
  onPreview?: (group: DocumentGroup) => void;
  onViewDetails?: (group: DocumentGroup) => void;
  onViewActivity?: (group: DocumentGroup) => void;
  onToggleLock?: (groupId: string) => void;
  onSupersede?: (group: DocumentGroup) => void;
  canEdit: boolean;
  canApprove: boolean;
  selectedProject?: string;
}

type SortField = 'document_number' | 'title' | 'category' | 'status' | 'created_at' | 'updated_at' | 'created_by';
type SortDirection = 'asc' | 'desc';

export const DocumentListView: React.FC<DocumentListViewProps> = ({
  documentGroups,
  onDownload,
  onDelete,
  onStatusChange,
  onTypeChange,
  onAccessibilityChange,
  onPreview,
  onViewDetails,
  onViewActivity,
  onToggleLock,
  onSupersede,
  canEdit,
  canApprove,
  selectedProject
}) => {
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [editingDocument, setEditingDocument] = useState<DocumentGroup | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sharingDocument, setSharingDocument] = useState<DocumentGroup | null>(null);
  const [isSharingDialogOpen, setIsSharingDialogOpen] = useState(false);
  const [historyDocument, setHistoryDocument] = useState<DocumentGroup | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [supersedeDocument, setSupersedeDocument] = useState<DocumentGroup | null>(null);
  const [isSupersedeDialogOpen, setIsSupersedeDialogOpen] = useState(false);
  const [deleteDocument, setDeleteDocument] = useState<DocumentGroup | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { projects } = useProjects();
  const { teamMembers } = useProjectTeam(selectedProject);
  const { profile } = useAuth();

  // Convert numeric version to alphanumeric (1=A, 2=B, etc.)
  const getVersionLabel = (revision?: DocumentGroup['current_revision']) => {
    if (!revision || !revision.revision_number || revision.revision_number < 1) return 'A';
    return String.fromCharCode(64 + revision.revision_number);
  };

  const getProjectNumber = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 'N/A';
    const code = project.name.substring(0, 3).toUpperCase();
    const year = new Date(project.created_at).getFullYear();
    return `${code}-${year}`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'for construction':
        return 'default';
      case 'for tender':
        return 'secondary';
      case 'for information':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(new Set(documentGroups.map(group => group.id)));
    } else {
      setSelectedDocuments(new Set());
    }
  };

  const handleSelectDocument = (documentId: string, checked: boolean) => {
    const newSelected = new Set(selectedDocuments);
    if (checked) {
      newSelected.add(documentId);
    } else {
      newSelected.delete(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleEditDocument = (group: DocumentGroup) => {
    setEditingDocument(group);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
    window.location.reload();
  };

  const handleShareDocument = (group: DocumentGroup) => {
    setSharingDocument(group);
    setIsSharingDialogOpen(true);
  };

  const handleViewHistory = (group: DocumentGroup) => {
    setHistoryDocument(group);
    setIsHistoryDialogOpen(true);
  };

  const handleSupersede = (group: DocumentGroup) => {
    setSupersedeDocument(group);
    setIsSupersedeDialogOpen(true);
  };

  const handleDeleteConfirm = (group: DocumentGroup) => {
    setDeleteDocument(group);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteExecute = (groupId: string) => {
    if (onDelete) {
      onDelete(groupId);
    }
    setIsDeleteDialogOpen(false);
    setDeleteDocument(null);
  };

  // Get user names
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  React.useEffect(() => {
    const loadUserNames = async () => {
      const uniqueUserIds = [...new Set(documentGroups.map(group => group.created_by))];
      const names: Record<string, string> = {};
      
      if (uniqueUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', uniqueUserIds);
        
        profiles?.forEach(profile => {
          names[profile.user_id] = profile.name || 'Unknown User';
        });
      }
      
      setUserNames(names);
    };
    
    if (documentGroups.length > 0) {
      loadUserNames();
    }
  }, [documentGroups]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort document groups
  const sortedDocumentGroups = useMemo(() => {
    return [...documentGroups].sort((a, b) => {
      let aValue: any = a[sortField as keyof DocumentGroup];
      let bValue: any = b[sortField as keyof DocumentGroup];

      // Handle special cases
      if (sortField === 'created_by') {
        aValue = userNames[a.created_by] || 'Unknown';
        bValue = userNames[b.created_by] || 'Unknown';
      } else if (sortField === 'category') {
        const validCategories = ['Architectural', 'Structural', 'Permit', 'Uncategorized'];
        aValue = validCategories.includes(a.category) ? a.category : 'Uncategorized';
        bValue = validCategories.includes(b.category) ? b.category : 'Uncategorized';
      } else if (sortField === 'created_at' || sortField === 'updated_at') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue === null || aValue === undefined) aValue = '';
      if (bValue === null || bValue === undefined) bValue = '';

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [documentGroups, sortField, sortDirection, userNames]);

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-semibold text-left justify-start"
      onClick={() => handleSort(field)}
    >
      {children}
      {sortField === field ? (
        sortDirection === 'asc' ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-2 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-2 h-4 w-4" />
      )}
    </Button>
  );

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedDocuments.size === documentGroups.length && documentGroups.length > 0} 
                onCheckedChange={handleSelectAll} 
              />
            </TableHead>
            <TableHead className="w-12">Type</TableHead>
            <TableHead className="w-12">Lock</TableHead>
            <TableHead className="w-32">
              <SortButton field="document_number">
                Document No.
              </SortButton>
            </TableHead>
            <TableHead className="min-w-[200px]">
              <SortButton field="title">
                Title
              </SortButton>
            </TableHead>
            <TableHead className="w-16">
              Rev
            </TableHead>
            <TableHead className="w-24">
              <SortButton field="status">
                Status
              </SortButton>
            </TableHead>
            <TableHead className="w-24">
              <SortButton field="created_at">
                Created
              </SortButton>
            </TableHead>
            <TableHead className="w-24">
              <SortButton field="updated_at">
                Updated
              </SortButton>
            </TableHead>
            <TableHead className="w-32">
              <SortButton field="created_by">
                Created By
              </SortButton>
            </TableHead>
            <TableHead className="w-32">
              <SortButton field="category">
                Category
              </SortButton>
            </TableHead>
            <TableHead className="w-32">
              Accessibility
            </TableHead>
            <TableHead className="w-16">Preview</TableHead>
            <TableHead className="w-16">History</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDocumentGroups.map(group => (
            <TableRow key={group.id} className="hover:bg-muted/50 border-b">
              <TableCell>
                <Checkbox 
                  checked={selectedDocuments.has(group.id)} 
                  onCheckedChange={checked => handleSelectDocument(group.id, checked as boolean)} 
                />
              </TableCell>
              
              <TableCell>
                <FileTypeIcon 
                  fileName={group.current_revision?.file_name || group.title} 
                  fileType={group.current_revision?.file_type || 'application/octet-stream'} 
                />
              </TableCell>
              
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0" 
                  onClick={() => onToggleLock?.(group.id)} 
                  disabled={!canEdit}
                >
                  {group.is_locked ? 
                    <Lock className="h-4 w-4 text-destructive" /> : 
                    <Unlock className="h-4 w-4 text-muted-foreground" />
                  }
                </Button>
              </TableCell>
              
              <TableCell className="font-mono text-xs">
                {canEdit ? group.document_number || 'N/A' : '-'}
              </TableCell>
              
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {group.title}
                </div>
              </TableCell>
              
              <TableCell className="font-mono text-center">
                {getVersionLabel(group.current_revision)}
              </TableCell>
              
              <TableCell>
                <Badge variant={getStatusBadgeColor(group.status)} className="text-xs">
                  {group.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              
              <TableCell className="text-xs text-foreground">
                {format(new Date(group.created_at), 'dd/MM/yy HH:mm')}
              </TableCell>
              
              <TableCell className="text-xs text-foreground">
                {format(new Date(group.updated_at), 'dd/MM/yy HH:mm')}
              </TableCell>
              
              <TableCell className="text-xs text-foreground">
                {userNames[group.created_by] || 'Loading...'}
              </TableCell>
              
              <TableCell className="text-xs text-foreground">
                {['Architectural', 'Structural', 'Permit'].includes(group.category) 
                  ? group.category 
                  : 'Uncategorized'}
              </TableCell>
              
              <TableCell>
                <div className="flex items-center gap-1">
                  <Badge variant={group.visibility_scope === 'private' ? 'secondary' : 'outline'} className="text-xs">
                    {group.visibility_scope === 'private' ? 'Private' : 'Public'}
                  </Badge>
                </div>
              </TableCell>
              
              <TableCell>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onPreview?.(group)}>
                  <Eye className="h-3 w-3" />
                </Button>
              </TableCell>

              <TableCell>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleViewHistory(group)}>
                  <Clock className="h-3 w-3" />
                </Button>
              </TableCell>
              
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border">
                    <DropdownMenuItem 
                      onClick={() => group.current_revision && onDownload(
                        group.current_revision.file_path, 
                        group.current_revision.file_name
                      )}
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Download
                    </DropdownMenuItem>
                    
                    {canEdit && onSupersede && (
                      <DropdownMenuItem onClick={() => handleSupersede(group)}>
                        <Edit className="h-3 w-3 mr-2" />
                        Supersede
                      </DropdownMenuItem>
                    )}
                    
                    {(group.visibility_scope === 'private' || group.created_by === profile?.user_id) && (
                      <DropdownMenuItem onClick={() => handleShareDocument(group)}>
                        <Share className="h-3 w-3 mr-2" />
                        Share
                      </DropdownMenuItem>
                    )}
                     
                    {canEdit && onDelete && (
                      <DropdownMenuItem onClick={() => handleDeleteConfirm(group)} className="text-destructive">
                        <X className="h-3 w-3 mr-2" />
                        Delete Forever
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {documentGroups.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileTypeIcon fileName="document.pdf" className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No documents found</p>
          <p className="text-sm">Upload your first document to get started</p>
        </div>
      )}

      {/* Dialogs */}
      <EditDocumentDialog
        document={editingDocument}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleEditSave}
      />

      <DocumentSharingDialog
        document={sharingDocument}
        isOpen={isSharingDialogOpen}
        onClose={() => setIsSharingDialogOpen(false)}
      />

      <DocumentHistoryDialog
        document={historyDocument}
        isOpen={isHistoryDialogOpen}
        onClose={() => setIsHistoryDialogOpen(false)}
        onDownload={onDownload}
      />

      <SupersedeDocumentDialog
        document={supersedeDocument}
        isOpen={isSupersedeDialogOpen}
        onClose={() => setIsSupersedeDialogOpen(false)}
        onSupersede={(group, file, summary) => {
          onSupersede?.(group);
          setIsSupersedeDialogOpen(false);
        }}
      />

      <DocumentDeleteConfirmDialog
        document={deleteDocument}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteExecute}
      />
    </div>
  );
};
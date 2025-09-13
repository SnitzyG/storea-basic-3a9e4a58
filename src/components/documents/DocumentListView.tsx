import React, { useState, useMemo } from 'react';
import { Lock, Unlock, Eye, Settings, MoreHorizontal, Download, Edit, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Document } from '@/hooks/useDocuments';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { FileTypeIcon } from './FileTypeIcon';
import { EditDocumentDialog } from './EditDocumentDialog';
interface DocumentListViewProps {
  documents: Document[];
  onDownload: (filePath: string, fileName: string) => void;
  onDelete?: (documentId: string, filePath: string) => void;
  onStatusChange?: (documentId: string, status: string) => void;
  onTypeChange?: (documentId: string, type: string) => void;
  onAccessibilityChange?: (documentId: string, accessibility: string) => void;
  onPreview?: (document: Document) => void;
  onViewDetails?: (document: Document) => void;
  onViewActivity?: (document: Document) => void;
  onToggleLock?: (documentId: string) => void;
  canEdit: boolean;
  canApprove: boolean;
  selectedProject?: string;
}
export const DocumentListView: React.FC<DocumentListViewProps> = ({
  documents,
  onDownload,
  onDelete,
  onStatusChange,
  onTypeChange,
  onAccessibilityChange,
  onPreview,
  onViewDetails,
  onViewActivity,
  onToggleLock,
  canEdit,
  canApprove,
  selectedProject
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { projects } = useProjects();
  const { teamMembers } = useProjectTeam(selectedProject);
  // Convert numeric version to alphanumeric (1=A, 2=B, etc.)
  const getVersionLabel = (version?: number) => {
    if (!version || version < 1) return 'A';
    return String.fromCharCode(64 + version); // 65 is 'A', so 64 + 1 = 'A'
  };
  const getProjectNumber = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 'N/A';
    // Generate project number from project name (first 3 chars + year)
    const code = project.name.substring(0, 3).toUpperCase();
    const year = new Date(project.created_at).getFullYear();
    return `${code}-${year}`;
  };
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'secondary';
      case 'for review':
      case 'under review':
        return 'outline';
      case 'approved':
        return 'default';
      case 'superseded':
        return 'outline';
      case 'void':
        return 'destructive';
      case 'final':
        return 'default';
      default:
        return 'secondary';
    }
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(new Set(documents.map(doc => doc.id)));
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
  const statusOptions = [{
    value: "For Tender",
    label: "For Tender"
  }, {
    value: "For Information",
    label: "For Information"
  }, {
    value: "For Construction",
    label: "For Construction"
  }];
  const typeOptions = [{
    value: "Architectural",
    label: "Architectural"
  }, {
    value: "Structural",
    label: "Structural"
  }, {
    value: "Permit",
    label: "Permit"
  }];
  const accessibilityOptions = [
    { value: 'public', label: 'Public' },
    { value: 'private', label: 'Private' }
  ];

  const handleEditDocument = (document: Document) => {
    setEditingDocument(document);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
    // Refresh documents list after edit
    window.location.reload(); // Simple refresh for now
  };

  // Get user name from user ID
  const getUserName = async (userId: string) => {
    try {
      const {
        data: profile
      } = await supabase.from('profiles').select('name').eq('user_id', userId).single();
      return profile?.name || 'Unknown User';
    } catch (error) {
      return 'Unknown User';
    }
  };
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // Load user names for all documents
  React.useEffect(() => {
    const loadUserNames = async () => {
      const uniqueUserIds = [...new Set(documents.map(doc => doc.uploaded_by))];
      const names: Record<string, string> = {};
      for (const userId of uniqueUserIds) {
        names[userId] = await getUserName(userId);
      }
      setUserNames(names);
    };
    if (documents.length > 0) {
      loadUserNames();
    }
  }, [documents]);
  return <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">
              <Checkbox checked={selectedDocuments.size === documents.length && documents.length > 0} onCheckedChange={handleSelectAll} />
            </TableHead>
            <TableHead className="w-12"> Type</TableHead>
            <TableHead className="w-12">Lock</TableHead>
            
            <TableHead className="w-32">Document No.</TableHead>
            <TableHead className="min-w-[200px]">Title</TableHead>
            <TableHead className="w-16">Rev</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-24">Created</TableHead>
            <TableHead className="w-32">Created By</TableHead>
            <TableHead className="w-32">File Type</TableHead>
            <TableHead className="w-32">Assigned To</TableHead>
            <TableHead className="w-16">Preview</TableHead>
            <TableHead className="w-16">History</TableHead>
            
            
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map(document => <TableRow key={document.id} className={`hover:bg-muted/50 border-b ${document.is_superseded ? 'opacity-60 bg-muted/30' : ''}`}>
              <TableCell>
                <Checkbox checked={selectedDocuments.has(document.id)} onCheckedChange={checked => handleSelectDocument(document.id, checked as boolean)} />
              </TableCell>
              
              <TableCell>
                <FileTypeIcon fileName={document.name} fileType={document.file_type} />
              </TableCell>
              
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onToggleLock?.(document.id)}
                  disabled={!canEdit}
                >
                  {document.is_locked ? 
                    <Lock className="h-4 w-4 text-destructive" /> : 
                    <Unlock className="h-4 w-4 text-muted-foreground" />
                  }
                </Button>
              </TableCell>
              
              
              
              <TableCell className="font-mono text-xs">
                {canEdit ? document.document_number || 'N/A' : '-'}
              </TableCell>
              
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {document.title || document.name}
                  {document.is_superseded && (
                    <Badge variant="outline" className="text-xs">
                      Superseded
                    </Badge>
                  )}
                </div>
              </TableCell>
              
              <TableCell className="font-mono text-center">
                {getVersionLabel(document.version)}
              </TableCell>
              
              <TableCell>
                <Badge variant={getStatusBadgeColor(document.status)} className="text-xs">
                  {document.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(document.created_at), 'dd/MM/yy')}
              </TableCell>
              
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(document.updated_at), 'dd/MM/yy')}
              </TableCell>
              
              <TableCell className="text-xs text-muted-foreground">
                {userNames[document.uploaded_by] || 'Loading...'}
              </TableCell>
              
              <TableCell>
                <Select value={document.category || 'general'} onValueChange={value => onTypeChange?.(document.id, value)} disabled={!canEdit || document.is_locked}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map(option => <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </TableCell>
              
              <TableCell>
                <Select 
                  value={document.visibility_scope === 'private' ? 'private' : 'public'} 
                  onValueChange={value => onAccessibilityChange?.(document.id, value)} 
                  disabled={!canEdit || document.is_locked}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select Accessibility" />
                  </SelectTrigger>
                  <SelectContent>
                    {accessibilityOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              
              <TableCell>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onPreview?.(document)}>
                  <Eye className="h-3 w-3" />
                </Button>
              </TableCell>
              
              <TableCell>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onViewActivity?.(document)}>
                  <Settings className="h-3 w-3" />
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
                    <DropdownMenuItem onClick={() => onDownload(document.file_path, document.name)}>
                      <Download className="h-3 w-3 mr-2" />
                      Download
                    </DropdownMenuItem>
                    
                    {canEdit && (
                      <DropdownMenuItem onClick={() => handleEditDocument(document)}>
                        <Edit className="h-3 w-3 mr-2" />
                        Edit Document
                      </DropdownMenuItem>
                    )}
                    
                    {canEdit && onDelete && <DropdownMenuItem onClick={() => onDelete(document.id, document.file_path)} className="text-destructive">
                        <X className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
      
      {documents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileTypeIcon fileName="document.pdf" className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No documents found</p>
        </div>
      )}

      <EditDocumentDialog
        document={editingDocument}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingDocument(null);
        }}
        onSave={handleEditSave}
      />
    </div>;
};
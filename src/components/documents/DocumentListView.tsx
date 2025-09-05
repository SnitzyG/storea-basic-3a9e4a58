import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Lock, 
  Unlock, 
  Eye, 
  Settings, 
  History, 
  Send,
  Check,
  X,
  MoreHorizontal,
  Download,
  Edit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Document } from '@/hooks/useDocuments';
import { useProjects } from '@/hooks/useProjects';
import { useProjectTeam } from '@/hooks/useProjectTeam';
import { format } from 'date-fns';

interface DocumentListViewProps {
  documents: Document[];
  onDownload: (filePath: string, fileName: string) => void;
  onDelete?: (documentId: string, filePath: string) => void;
  onStatusChange?: (documentId: string, status: string) => void;
  onPreview?: (document: Document) => void;
  onViewDetails?: (document: Document) => void;
  onViewEvents?: (document: Document) => void;
  onViewTransmittals?: (document: Document) => void;
  canEdit: boolean;
  canApprove: boolean;
  selectedProject?: string;
}

export const DocumentListView: React.FC<DocumentListViewProps> = ({
  documents,
  onDownload,
  onDelete,
  onStatusChange,
  onPreview,
  onViewDetails,
  onViewEvents,
  onViewTransmittals,
  canEdit,
  canApprove,
  selectedProject
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const { projects } = useProjects();
  const { teamMembers } = useProjectTeam(selectedProject);

  const getFileTypeIcon = (fileType: string) => {
    return <FileText className="h-4 w-4 text-muted-foreground" />;
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
      case 'draft': return 'secondary';
      case 'for review':
      case 'under review': return 'outline';
      case 'approved': return 'default';
      case 'superseded': return 'outline';
      case 'void': return 'destructive';
      case 'final': return 'default';
      default: return 'secondary';
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

  const statusOptions = [
    'Draft',
    'For Review', 
    'Under Review',
    'Approved',
    'Superseded',
    'Void',
    'Final'
  ];

  const typeOptions = [
    'Architectural Drawings',
    'Structural Plans',
    'Electrical Plans',
    'Plumbing Plans',
    'Specifications',
    'Contracts',
    'Permits',
    'Reports',
    'Correspondence',
    'Photographs'
  ];

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">
              <Checkbox
                checked={selectedDocuments.size === documents.length && documents.length > 0}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="w-12">Type</TableHead>
            <TableHead className="w-12">Lock</TableHead>
            <TableHead className="w-24">Project No.</TableHead>
            <TableHead className="w-32">Document No.</TableHead>
            <TableHead className="min-w-[200px]">Title</TableHead>
            <TableHead className="w-16">Rev</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-24">Created</TableHead>
            <TableHead className="w-32">Created By</TableHead>
            <TableHead className="w-32">Type</TableHead>
            <TableHead className="w-32">Assigned To</TableHead>
            <TableHead className="w-16">Preview</TableHead>
            <TableHead className="w-16">Properties</TableHead>
            <TableHead className="w-16">Events</TableHead>
            <TableHead className="w-16">Transmittals</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((document) => (
            <TableRow 
              key={document.id}
              className="hover:bg-muted/50 border-b"
            >
              <TableCell>
                <Checkbox
                  checked={selectedDocuments.has(document.id)}
                  onCheckedChange={(checked) => 
                    handleSelectDocument(document.id, checked as boolean)
                  }
                />
              </TableCell>
              
              <TableCell>
                {getFileTypeIcon(document.file_type)}
              </TableCell>
              
              <TableCell>
                {document.is_locked ? (
                  <Lock className="h-4 w-4 text-destructive" />
                ) : (
                  <Unlock className="h-4 w-4 text-muted-foreground" />
                )}
              </TableCell>
              
              <TableCell className="font-mono text-xs">
                {canEdit ? getProjectNumber(document.project_id) : '-'}
              </TableCell>
              
              <TableCell className="font-mono text-xs">
                {canEdit ? document.document_number || 'N/A' : '-'}
              </TableCell>
              
              <TableCell className="font-medium">
                {document.title || document.name}
              </TableCell>
              
              <TableCell className="font-mono text-center">
                {document.version || 1}
              </TableCell>
              
              <TableCell>
                {onStatusChange ? (
                  <Select 
                    value={document.status} 
                    onValueChange={(value) => onStatusChange(document.id, value)}
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status.toLowerCase().replace(' ', '_')}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant={getStatusBadgeColor(document.status)} className="text-xs">
                    {document.status.replace('_', ' ')}
                  </Badge>
                )}
              </TableCell>
              
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(document.created_at), 'dd/MM/yy')}
              </TableCell>
              
              <TableCell className="text-xs text-muted-foreground">
                User {document.uploaded_by.substring(0, 8)}...
              </TableCell>
              
              <TableCell>
                <Select 
                  value={document.category || 'general'} 
                  onValueChange={(value) => {/* TODO: Update document type */}}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase().replace(' ', '_')}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              
              <TableCell>
                <Select 
                  value={document.assigned_to || ''} 
                  onValueChange={(value) => {/* TODO: Update assigned to */}}
                  disabled={!canEdit}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.user_profile?.name || 'Unknown User'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onPreview?.(document)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </TableCell>
              
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onViewDetails?.(document)}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </TableCell>
              
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onViewEvents?.(document)}
                >
                  <History className="h-3 w-3" />
                </Button>
              </TableCell>
              
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => onViewTransmittals?.(document)}
                >
                  <Send className="h-3 w-3" />
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
                      onClick={() => onDownload(document.file_path, document.name)}
                    >
                      <Download className="h-3 w-3 mr-2" />
                      Download
                    </DropdownMenuItem>
                    
                    {canEdit && (
                      <DropdownMenuItem>
                        <Edit className="h-3 w-3 mr-2" />
                        Edit Title
                      </DropdownMenuItem>
                    )}
                    
                    {canEdit && onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(document.id, document.file_path)}
                        className="text-destructive"
                      >
                        <X className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {documents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No documents found</p>
        </div>
      )}
    </div>
  );
};
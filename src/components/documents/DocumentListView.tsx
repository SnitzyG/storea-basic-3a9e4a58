import React, { useState, useMemo } from 'react';
import { FileText, Lock, Unlock, Eye, Settings, History, Send, Check, X, MoreHorizontal, Download, Edit, Image, FileCheck, Building, Zap, Wrench, FileBarChart, Mail, Camera } from 'lucide-react';
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
interface DocumentListViewProps {
  documents: Document[];
  onDownload: (filePath: string, fileName: string) => void;
  onDelete?: (documentId: string, filePath: string) => void;
  onStatusChange?: (documentId: string, status: string) => void;
  onTypeChange?: (documentId: string, type: string) => void;
  onAssignedToChange?: (documentId: string, assignedTo: string) => void;
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
  onTypeChange,
  onAssignedToChange,
  onPreview,
  onViewDetails,
  onViewEvents,
  onViewTransmittals,
  canEdit,
  canApprove,
  selectedProject
}) => {
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const {
    projects
  } = useProjects();
  const {
    teamMembers
  } = useProjectTeam(selectedProject);
  const getFileTypeIcon = (category: string) => {
    const iconMap = {
      'architectural_drawings': <Building className="h-4 w-4 text-blue-500" />,
      'structural_plans': <FileBarChart className="h-4 w-4 text-green-500" />,
      'electrical_plans': <Zap className="h-4 w-4 text-yellow-500" />,
      'plumbing_plans': <Wrench className="h-4 w-4 text-cyan-500" />,
      'specifications': <FileCheck className="h-4 w-4 text-purple-500" />,
      'contracts': <FileText className="h-4 w-4 text-red-500" />,
      'permits': <FileText className="h-4 w-4 text-orange-500" />,
      'reports': <FileBarChart className="h-4 w-4 text-indigo-500" />,
      'correspondence': <Mail className="h-4 w-4 text-gray-500" />,
      'photographs': <Camera className="h-4 w-4 text-pink-500" />
    };
    return iconMap[category as keyof typeof iconMap] || <FileText className="h-4 w-4 text-muted-foreground" />;
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
    value: "draft",
    label: "Draft"
  }, {
    value: "for_review",
    label: "For Review"
  }, {
    value: "under_review",
    label: "Under Review"
  }, {
    value: "approved",
    label: "Approved"
  }, {
    value: "superseded",
    label: "Superseded"
  }, {
    value: "void",
    label: "Void"
  }, {
    value: "final",
    label: "Final"
  }];
  const typeOptions = [{
    value: "architectural_drawings",
    label: "Architectural Drawings"
  }, {
    value: "structural_plans",
    label: "Structural Plans"
  }, {
    value: "electrical_plans",
    label: "Electrical Plans"
  }, {
    value: "plumbing_plans",
    label: "Plumbing Plans"
  }, {
    value: "specifications",
    label: "Specifications"
  }, {
    value: "contracts",
    label: "Contracts"
  }, {
    value: "permits",
    label: "Permits"
  }, {
    value: "reports",
    label: "Reports"
  }, {
    value: "correspondence",
    label: "Correspondence"
  }, {
    value: "photographs",
    label: "Photographs"
  }];
  const assignedToOptions = useMemo(() => {
    return teamMembers.map(member => ({
      value: member.user_id,
      label: `${member.user_profile?.name || 'Unknown User'} (${member.user_profile?.role || member.role})`
    }));
  }, [teamMembers]);

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
            <TableHead className="w-12">File Type</TableHead>
            <TableHead className="w-12">Lock</TableHead>
            
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
            <TableHead className="w-16">History</TableHead>
            <TableHead className="w-16">Transmittals</TableHead>
            <TableHead className="w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map(document => <TableRow key={document.id} className="hover:bg-muted/50 border-b">
              <TableCell>
                <Checkbox checked={selectedDocuments.has(document.id)} onCheckedChange={checked => handleSelectDocument(document.id, checked as boolean)} />
              </TableCell>
              
              <TableCell>
                {getFileTypeIcon(document.category || 'general')}
              </TableCell>
              
              <TableCell>
                {document.is_locked ? <Lock className="h-4 w-4 text-destructive" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
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
                {onStatusChange && !document.is_locked ? <Select value={document.status} onValueChange={value => onStatusChange(document.id, value)} disabled={document.is_locked}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>)}
                    </SelectContent>
                  </Select> : <Badge variant={getStatusBadgeColor(document.status)} className="text-xs">
                    {document.status.replace('_', ' ')}
                  </Badge>}
              </TableCell>
              
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(document.created_at), 'dd/MM/yy')}
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
                <Select value={document.assigned_to || 'unassigned'} onValueChange={value => onAssignedToChange?.(document.id, value === 'unassigned' ? '' : value)} disabled={!canEdit || document.is_locked}>
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select Team Member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {assignedToOptions.map(option => <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </TableCell>
              
              <TableCell>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onPreview?.(document)}>
                  <Eye className="h-3 w-3" />
                </Button>
              </TableCell>
              
              <TableCell>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onViewDetails?.(document)}>
                  <Settings className="h-3 w-3" />
                </Button>
              </TableCell>
              
              <TableCell>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onViewEvents?.(document)}>
                  <History className="h-3 w-3" />
                </Button>
              </TableCell>
              
              <TableCell>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => onViewTransmittals?.(document)}>
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
                    <DropdownMenuItem onClick={() => onDownload(document.file_path, document.name)}>
                      <Download className="h-3 w-3 mr-2" />
                      Download
                    </DropdownMenuItem>
                    
                    {canEdit && <DropdownMenuItem>
                        <Edit className="h-3 w-3 mr-2" />
                        Edit Title
                      </DropdownMenuItem>}
                    
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
      
      {documents.length === 0 && <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No documents found</p>
        </div>}
    </div>;
};
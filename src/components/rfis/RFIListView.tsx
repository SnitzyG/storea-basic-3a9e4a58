import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Eye, Download, MoreHorizontal, MessageSquare, CheckSquare, Square, Send, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RFI } from '@/hooks/useRFIs';
import { format } from 'date-fns';
import { RFIQuickActions } from './RFIQuickActions';

interface RFIListViewProps {
  rfis: RFI[];
  onView: (rfi: RFI) => void;
  onCreateResponse?: (rfi: RFI) => void;
  onExportPDF: (rfi: RFI) => void;
  onSelectRFI?: (rfi: RFI) => void;
  selectedRFI?: RFI | null;
  onDoubleClick?: (rfi: RFI) => void;
  onUpdateRFI?: (rfiId: string, updates: Partial<RFI>) => Promise<void>;
  onSendDraft?: (rfi: RFI) => void;
  onDeleteRFI?: (rfi: RFI) => void;
  projectUsers?: any[];
  showQuickActions?: boolean;
  selectedRFIIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

type SortField = 'subject' | 'submitted_by' | 'assigned_to' | 'created_at' | 'status' | 'due_date';
type SortDirection = 'asc' | 'desc';

const statusColors = {
  draft: 'bg-slate-100 text-slate-700 border-slate-300',
  sent: 'bg-blue-50 text-blue-700 border-blue-300',
  received: 'bg-indigo-50 text-indigo-700 border-indigo-300',
  outstanding: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
  in_review: 'bg-purple-50 text-purple-700 border-purple-300',
  answered: 'bg-green-100 text-green-800 border-green-200', 
  rejected: 'bg-red-50 text-red-600 border-red-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200'
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200'
};

export const RFIListView: React.FC<RFIListViewProps> = ({ 
  rfis, 
  onView, 
  onExportPDF,
  onSelectRFI,
  selectedRFI,
  onDoubleClick,
  onUpdateRFI,
  onSendDraft,
  onDeleteRFI,
  projectUsers = [],
  showQuickActions = false,
  selectedRFIIds = [],
  onSelectionChange
}) => {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRFIs = useMemo(() => {
    return [...rfis].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'subject':
          aValue = a.subject || a.question;
          bValue = b.subject || b.question;
          break;
        case 'submitted_by':
          aValue = a.raised_by_profile?.name || a.sender_name || '';
          bValue = b.raised_by_profile?.name || b.sender_name || '';
          break;
        case 'assigned_to':
          aValue = a.assigned_to_profile?.name || a.recipient_name || '';
          bValue = b.assigned_to_profile?.name || b.recipient_name || '';
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date) : new Date(0);
          bValue = b.due_date ? new Date(b.due_date) : new Date(0);
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [rfis, sortField, sortDirection]);

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:bg-muted/50 p-1 rounded transition-colors"
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  const handleRowClick = (rfi: RFI) => {
    if (onSelectRFI) {
      onSelectRFI(rfi);
    }
  };

  const handleCheckboxChange = (rfiId: string, checked: boolean) => {
    if (!onSelectionChange) return;
    
    if (checked) {
      onSelectionChange([...selectedRFIIds, rfiId]);
    } else {
      onSelectionChange(selectedRFIIds.filter(id => id !== rfiId));
    }
  };

  const isRFISelected = (rfiId: string) => selectedRFIIds.includes(rfiId);

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            {onSelectionChange && (
              <TableHead className="w-[40px]">
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </TableHead>
            )}
            <TableHead className="w-[60px]">RFI #</TableHead>
            <TableHead>
              <SortButton field="subject">Subject / Title</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="submitted_by">Submitted By</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="assigned_to">Assigned To</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="created_at">Date Submitted</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="status">Status</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="due_date">Due Date</SortButton>
            </TableHead>
            <TableHead>Priority</TableHead>
            {showQuickActions && <TableHead>Quick Actions</TableHead>}
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRFIs.map((rfi) => (
            <TableRow 
              key={rfi.id} 
              className={`hover:bg-muted/50 cursor-pointer ${
                selectedRFI?.id === rfi.id ? 'bg-muted/50' : ''
              } ${isRFISelected(rfi.id) ? 'bg-accent/20' : ''}`}
              onClick={() => handleRowClick(rfi)}
              onDoubleClick={() => onDoubleClick?.(rfi)}
            >
              {onSelectionChange && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handleCheckboxChange(rfi.id, !isRFISelected(rfi.id))}
                  >
                    {isRFISelected(rfi.id) ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </TableCell>
              )}
              <TableCell className="font-mono text-xs">
                {rfi.rfi_number || `RFI-${rfi.id.slice(0, 8)}`}
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="font-medium text-sm leading-none">
                    {rfi.subject || rfi.question.substring(0, 50) + (rfi.question.length > 50 ? '...' : '')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rfi.project_name || 'Project'}
                  </p>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {rfi.raised_by_profile?.name || rfi.sender_name || 'Unknown'}
              </TableCell>
              <TableCell className="text-sm">
                {rfi.assigned_to_profile?.name || rfi.recipient_name || 'Unassigned'}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(rfi.created_at), 'MMM dd, yyyy HH:mm')}
              </TableCell>
              <TableCell>
                <Badge className={`text-xs ${statusColors[rfi.status as keyof typeof statusColors] || statusColors.outstanding}`}>
                  {rfi.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {rfi.due_date || rfi.required_response_by 
                  ? format(new Date(rfi.due_date || rfi.required_response_by), 'MMM dd, yyyy')
                  : '-'
                }
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${priorityColors[rfi.priority as keyof typeof priorityColors] || priorityColors.medium}`}
                >
                  {rfi.priority.toUpperCase()}
                </Badge>
              </TableCell>
              {showQuickActions && onUpdateRFI && (
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RFIQuickActions
                    rfi={rfi}
                    onUpdateRFI={onUpdateRFI}
                    projectUsers={projectUsers}
                    compact={true}
                  />
                </TableCell>
              )}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border">
                    {rfi.status === 'draft' && onSendDraft && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSendDraft(rfi); }}>
                        <Send className="h-3 w-3 mr-2" />
                        Send RFI
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView(rfi); }}>
                      <Eye className="h-3 w-3 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExportPDF(rfi); }}>
                      <Download className="h-3 w-3 mr-2" />
                      Export PDF
                    </DropdownMenuItem>
                    
                    {onDeleteRFI && (
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); onDeleteRFI(rfi); }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete RFI
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {sortedRFIs.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No RFIs found</p>
          <p className="text-sm">Create your first RFI to get started</p>
        </div>
      )}
    </div>
  );
};
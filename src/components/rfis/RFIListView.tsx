import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Download, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { RFI } from '@/hooks/useRFIs';

interface RFIListViewProps {
  rfis: RFI[];
  onView: (rfi: RFI) => void;
  onExportPDF: (rfi: RFI) => void;
}

type SortField = 'rfi_number' | 'created_at' | 'project_name' | 'recipient_name' | 'status' | 'priority';
type SortDirection = 'asc' | 'desc';

const statusColors = {
  submitted: 'bg-blue-100 text-blue-800 border-blue-200',
  in_review: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  responded: 'bg-green-100 text-green-800 border-green-200',
  closed: 'bg-gray-100 text-gray-800 border-gray-200',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800 border-gray-200',
  medium: 'bg-blue-100 text-blue-800 border-blue-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

export const RFIListView: React.FC<RFIListViewProps> = ({
  rfis,
  onView,
  onExportPDF,
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

  const sortedRFIs = [...rfis].sort((a, b) => {
    let aValue, bValue;

    switch (sortField) {
      case 'rfi_number':
        aValue = a.rfi_number || '';
        bValue = b.rfi_number || '';
        break;
      case 'created_at':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      case 'project_name':
        aValue = a.project_name || '';
        bValue = b.project_name || '';
        break;
      case 'recipient_name':
        aValue = a.recipient_name || '';
        bValue = b.recipient_name || '';
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'priority':
        const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        aValue = priorityOrder[a.priority];
        bValue = priorityOrder[b.priority];
        break;
      default:
        aValue = a.created_at;
        bValue = b.created_at;
    }

    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-semibold text-left justify-start"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <SortButton field="rfi_number">RFI Number</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="created_at">Date</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="project_name">Project</SortButton>
            </TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>
              <SortButton field="recipient_name">Recipient</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="status">Status</SortButton>
            </TableHead>
            <TableHead>
              <SortButton field="priority">Priority</SortButton>
            </TableHead>
            <TableHead>Required By</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRFIs.map((rfi) => (
            <TableRow key={rfi.id}>
              <TableCell className="font-medium">
                {rfi.rfi_number || `RFI-${rfi.id.slice(0, 8)}`}
              </TableCell>
              <TableCell>
                {format(new Date(rfi.created_at), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                {rfi.project_name || 'Project'}
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {rfi.subject || rfi.question.substring(0, 50) + '...'}
              </TableCell>
              <TableCell>
                {rfi.recipient_name || rfi.assigned_to_profile?.name || 'Unassigned'}
              </TableCell>
              <TableCell>
                <Badge className={statusColors[rfi.status]}>
                  {rfi.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className={priorityColors[rfi.priority]}>
                  {rfi.priority.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                {rfi.required_response_by 
                  ? format(new Date(rfi.required_response_by), 'MMM dd, yyyy')
                  : rfi.due_date 
                    ? format(new Date(rfi.due_date), 'MMM dd, yyyy')
                    : '-'
                }
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onView(rfi)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onExportPDF(rfi)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  Plus, 
  Eye, 
  Download, 
  ArrowUpDown, 
  Filter, 
  X,
  Mail,
  FileText,
  Package,
  Users,
  Building,
  ChevronDown,
  ChevronRight,
  Bell
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { RFI } from '@/hooks/useRFIs';
import { getRfiNumberDisplay } from '@/utils/rfiUtils';

interface EnhancedRFIDashboardProps {
  rfis: RFI[];
  onView: (rfi: RFI) => void;
  onCreateNew: () => void;
  onExportPDF: (rfi: RFI) => void;
  projectUsers: any[];
  currentProject: any;
}

type SortField = 'rfi_number' | 'created_at' | 'project_name' | 'recipient_name' | 'status' | 'priority';
type SortDirection = 'asc' | 'desc';

const statusConfig = {
  outstanding: { label: 'Outstanding', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  overdue: { label: 'Overdue', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  responded: { label: 'Responded', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  closed: { label: 'Closed', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

const priorityConfig = {
  critical: { label: 'Critical', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  high: { label: 'High', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  medium: { label: 'Medium', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  low: { label: 'Low', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

export const EnhancedRFIDashboard: React.FC<EnhancedRFIDashboardProps> = ({
  rfis,
  onView,
  onCreateNew,
  onExportPDF,
  projectUsers,
  currentProject
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  

  // Filter and sort RFIs
  const filteredAndSortedRFIs = useMemo(() => {
    let filtered = rfis.filter(rfi => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!rfi.question.toLowerCase().includes(query) &&
            !rfi.subject?.toLowerCase().includes(query) &&
            !rfi.category?.toLowerCase().includes(query) &&
            !rfi.raised_by_profile?.name?.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && rfi.status !== statusFilter) return false;
      
      // Priority filter
      if (priorityFilter !== 'all' && rfi.priority !== priorityFilter) return false;
      
      // Assignee filter
      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'unassigned' && rfi.assigned_to) return false;
        if (assigneeFilter !== 'unassigned' && rfi.assigned_to !== assigneeFilter) return false;
      }

      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
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
  }, [rfis, searchQuery, statusFilter, priorityFilter, assigneeFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssigneeFilter('all');
  };

  const hasActiveFilters = statusFilter !== 'all' || priorityFilter !== 'all' || assigneeFilter !== 'all' || searchQuery;

  // Calculate stats
  const stats = useMemo(() => {
    const outstanding = rfis.filter(r => r.status === 'outstanding').length;
    const overdue = rfis.filter(r => r.status === 'overdue').length;
    const unread = rfis.filter(r => !r.response).length;
    return { outstanding, overdue, unread, total: rfis.length };
  }, [rfis]);

  const SortButton: React.FC<{ field: SortField; children: React.ReactNode }> = ({ field, children }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-semibold text-left justify-start hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
    </Button>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content */}
      <div className="flex flex-col overflow-hidden w-full">
        {/* Header */}
        <div className="border-b bg-card p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">RFIs</h1>
              <p className="text-muted-foreground">
                Manage requests for information for {currentProject?.name}
              </p>
            </div>
            <Button 
              onClick={onCreateNew}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New RFI
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b bg-card">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search RFIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Advanced Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="outstanding">Outstanding</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="responded">Responded</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Assignees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {projectUsers.map((user) => (
                    <SelectItem key={user.user_id} value={user.user_id}>
                      {user.profiles?.name || 'Unknown'} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 overflow-auto p-6">
          <div className="border rounded-lg bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <SortButton field="rfi_number">Mail Number</SortButton>
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
                {filteredAndSortedRFIs.map((rfi) => (
                  <TableRow key={rfi.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {getRfiNumberDisplay(rfi)}
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
                      <Badge 
                        className={`${statusConfig[rfi.status].bg} ${statusConfig[rfi.status].text} ${statusConfig[rfi.status].border} border`}
                      >
                        {statusConfig[rfi.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`${priorityConfig[rfi.priority].bg} ${priorityConfig[rfi.priority].text} ${priorityConfig[rfi.priority].border} border`}
                      >
                        {priorityConfig[rfi.priority].label}
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

          {filteredAndSortedRFIs.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold mb-2">No RFIs Found</h3>
              <p className="text-muted-foreground mb-4">
                {rfis.length === 0
                  ? "No RFIs have been created for this project yet."
                  : "No RFIs match your current filters."
                }
              </p>
              {rfis.length === 0 && (
                <Button onClick={onCreateNew}>
                  Create First RFI
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
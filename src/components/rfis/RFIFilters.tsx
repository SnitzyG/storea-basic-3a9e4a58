import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

interface RFIFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  priorityFilter: string;
  onPriorityFilterChange: (priority: string) => void;
  assigneeFilter: string;
  onAssigneeFilterChange: (assignee: string) => void;
  projectUsers: any[];
  onClearFilters: () => void;
}

export const RFIFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  priorityFilter,
  onPriorityFilterChange,
  assigneeFilter,
  onAssigneeFilterChange,
  projectUsers,
  onClearFilters,
}: RFIFiltersProps) => {
  const hasActiveFilters = statusFilter || priorityFilter || assigneeFilter || searchQuery;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search RFIs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
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

        <Select value={assigneeFilter} onValueChange={onAssigneeFilterChange}>
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
          <Button variant="outline" onClick={onClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};
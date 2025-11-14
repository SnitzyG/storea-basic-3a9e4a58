import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, Calendar as CalendarIcon, Download, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface ActivityLogFiltersProps {
  onFilterChange: (filters: ActivityFilters) => void;
  onExport: (format: 'csv' | 'pdf') => void;
  loading?: boolean;
}

export interface ActivityFilters {
  search: string;
  module: string;
  action: string;
  user: string;
  severity: string;
  dateRange?: DateRange;
}

const MODULES = [
  { value: 'all', label: 'All Modules' },
  { value: 'project', label: 'Projects' },
  { value: 'document', label: 'Documents' },
  { value: 'message', label: 'Messages' },
  { value: 'rfi', label: 'RFIs' },
  { value: 'tender', label: 'Tenders' },
  { value: 'financial', label: 'Financials' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'task', label: 'Tasks' },
  { value: 'user', label: 'Users' },
];

const ACTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'deleted', label: 'Deleted' },
  { value: 'uploaded', label: 'Uploaded' },
  { value: 'downloaded', label: 'Downloaded' },
  { value: 'shared', label: 'Shared' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

const SEVERITY_LEVELS = [
  { value: 'all', label: 'All Severity' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'critical', label: 'Critical' },
];

export const ActivityLogFilters = ({ onFilterChange, onExport, loading }: ActivityLogFiltersProps) => {
  const [filters, setFilters] = useState<ActivityFilters>({
    search: '',
    module: 'all',
    action: 'all',
    user: '',
    severity: 'all',
  });

  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof ActivityFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    const newFilters = { ...filters, dateRange: range };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: ActivityFilters = {
      search: '',
      module: 'all',
      action: 'all',
      user: '',
      severity: 'all',
    };
    setFilters(clearedFilters);
    setDateRange(undefined);
    onFilterChange(clearedFilters);
  };

  const hasActiveFilters = 
    filters.search || 
    filters.module !== 'all' || 
    filters.action !== 'all' || 
    filters.user || 
    filters.severity !== 'all' ||
    dateRange;

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activity logs..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                {[
                  filters.module !== 'all',
                  filters.action !== 'all',
                  filters.user,
                  filters.severity !== 'all',
                  dateRange,
                ].filter(Boolean).length}
              </span>
            )}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onExport('csv')}
                  disabled={loading}
                >
                  Export as CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => onExport('pdf')}
                  disabled={loading}
                >
                  Export as PDF
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 p-4 rounded-lg border bg-card">
          <div className="space-y-2">
            <Label htmlFor="module-filter">Module</Label>
            <Select
              value={filters.module}
              onValueChange={(value) => handleFilterChange('module', value)}
            >
              <SelectTrigger id="module-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODULES.map((module) => (
                  <SelectItem key={module.value} value={module.value}>
                    {module.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action-filter">Action Type</Label>
            <Select
              value={filters.action}
              onValueChange={(value) => handleFilterChange('action', value)}
            >
              <SelectTrigger id="action-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="severity-filter">Severity</Label>
            <Select
              value={filters.severity}
              onValueChange={(value) => handleFilterChange('severity', value)}
            >
              <SelectTrigger id="severity-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-filter">User</Label>
            <Input
              id="user-filter"
              placeholder="Filter by user..."
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y')} -{' '}
                        {format(dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
};

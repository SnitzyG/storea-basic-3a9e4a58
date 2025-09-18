import React, { useState } from 'react';
import { Search, Filter, SortAsc, SortDesc, X, Star, Settings2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RFI } from '@/hooks/useRFIs';

export type SortOption = 'due_date' | 'priority' | 'status' | 'sender' | 'created_at' | 'updated_at';
export type SortDirection = 'asc' | 'desc';

export interface SmartFilters {
  searchQuery: string;
  sortBy: SortOption;
  sortDirection: SortDirection;
  disciplineFilter: string;
  subcontractorFilter: string;
  priorityFilter: string;
  statusFilter: string;
  tagFilter: string;
}

export interface SavedView {
  id: string;
  name: string;
  filters: SmartFilters;
  isDefault?: boolean;
}

interface RFISmartFiltersProps {
  filters: SmartFilters;
  onFiltersChange: (filters: SmartFilters) => void;
  projectUsers: any[];
  rfis: RFI[];
  savedViews: SavedView[];
  onSaveView: (name: string, filters: SmartFilters) => void;
  onLoadView: (view: SavedView) => void;
  onDeleteView: (viewId: string) => void;
}

export const RFISmartFilters = ({
  filters,
  onFiltersChange,
  projectUsers,
  rfis,
  savedViews,
  onSaveView,
  onLoadView,
  onDeleteView
}: RFISmartFiltersProps) => {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');

  const updateFilter = (key: keyof SmartFilters, value: string) => {
    console.log(`Updating filter ${key} to:`, value);
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearAllFilters = () => {
    console.log('Clearing all filters');
    const clearedFilters = {
      searchQuery: '',
      sortBy: 'created_at' as SortOption,
      sortDirection: 'desc' as SortDirection,
      disciplineFilter: '',
      subcontractorFilter: '',
      priorityFilter: '',
      statusFilter: '',
      tagFilter: ''
    };
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = filters.searchQuery || 
    (filters.disciplineFilter && filters.disciplineFilter !== 'all') || 
    (filters.subcontractorFilter && filters.subcontractorFilter !== 'all') || 
    (filters.priorityFilter && filters.priorityFilter !== 'all') || 
    (filters.statusFilter && filters.statusFilter !== 'all') || 
    (filters.tagFilter && filters.tagFilter !== 'all');

  const handleSaveCurrentView = () => {
    if (newViewName.trim()) {
      console.log('Saving view:', newViewName.trim(), filters);
      onSaveView(newViewName.trim(), filters);
      setNewViewName('');
    }
  };

  // Extract unique values from RFIs for filter options
  const uniqueDisciplines = React.useMemo(() => {
    const disciplines = [...new Set(rfis.map(rfi => rfi.category).filter(Boolean))];
    console.log('Unique disciplines:', disciplines);
    return disciplines;
  }, [rfis]);
  
  const uniqueSubcontractors = React.useMemo(() => {
    const contractors = [...new Set(projectUsers.map(user => user.profiles?.name).filter(Boolean))];
    console.log('Unique subcontractors:', contractors);
    return contractors;
  }, [projectUsers]);
  
  const uniqueTags = React.useMemo(() => {
    const tags = [...new Set(rfis.flatMap(rfi => 
      (rfi.question + ' ' + (rfi.response || '')).match(/#\w+/g) || []
    ))];
    console.log('Unique tags:', tags);
    return tags;
  }, [rfis]);

  const sortOptions = [
    { value: 'created_at', label: 'Date Created' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'sender', label: 'Sender' },
    { value: 'updated_at', label: 'Last Updated' }
  ];

  return (
    <div className="space-y-3">
      {/* Search and Sort Row */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search RFIs, questions, responses..."
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value as SortOption)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => updateFilter('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')}
            className="px-2"
          >
            {filters.sortDirection === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Advanced Filters Toggle */}
        <Popover open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                  !
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Filters</h4>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>

              <Separator />

              {/* Discipline Filter */}
              <div className="space-y-2">
                <Label>Discipline</Label>
                <Select value={filters.disciplineFilter} onValueChange={(value) => updateFilter('disciplineFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Disciplines" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Disciplines</SelectItem>
                    <SelectItem value="Architectural">Architectural</SelectItem>
                    <SelectItem value="Structural">Structural</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Mechanical">Mechanical</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Civil">Civil</SelectItem>
                    {uniqueDisciplines.map(discipline => (
                      <SelectItem key={discipline} value={discipline!}>
                        {discipline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcontractor Filter */}
              <div className="space-y-2">
                <Label>Subcontractor</Label>
                <Select value={filters.subcontractorFilter} onValueChange={(value) => updateFilter('subcontractorFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Subcontractors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subcontractors</SelectItem>
                    {uniqueSubcontractors.map(contractor => (
                      <SelectItem key={contractor} value={contractor!}>
                        {contractor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={filters.priorityFilter} onValueChange={(value) => updateFilter('priorityFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.statusFilter} onValueChange={(value) => updateFilter('statusFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="outstanding">Outstanding</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="in_review">In Review</SelectItem>
                    <SelectItem value="answered">Answered</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tag Filter */}
              <div className="space-y-2">
                <Label>Tags</Label>
                <Select value={filters.tagFilter} onValueChange={(value) => updateFilter('tagFilter', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    <SelectItem value="#urgent">#urgent</SelectItem>
                    <SelectItem value="#design_issue">#design_issue</SelectItem>
                    <SelectItem value="#coordination">#coordination</SelectItem>
                    <SelectItem value="#clarification">#clarification</SelectItem>
                    {uniqueTags.map(tag => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Saved Views */}
      <div className="flex items-center gap-2 flex-wrap">
        {savedViews.map(view => (
          <div key={view.id} className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLoadView(view)}
              className="h-7 text-xs"
            >
              {view.isDefault && <Star className="h-3 w-3 mr-1" />}
              {view.name}
            </Button>
            {!view.isDefault && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteView(view.id)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Active filters:</span>
          {filters.disciplineFilter && (
            <Badge variant="secondary" className="text-xs">
              Discipline: {filters.disciplineFilter}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => updateFilter('disciplineFilter', '')}
              />
            </Badge>
          )}
          {filters.subcontractorFilter && (
            <Badge variant="secondary" className="text-xs">
              Subcontractor: {filters.subcontractorFilter}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => updateFilter('subcontractorFilter', '')}
              />
            </Badge>
          )}
          {filters.priorityFilter && (
            <Badge variant="secondary" className="text-xs">
              Priority: {filters.priorityFilter}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => updateFilter('priorityFilter', '')}
              />
            </Badge>
          )}
          {filters.statusFilter && (
            <Badge variant="secondary" className="text-xs">
              Status: {filters.statusFilter}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => updateFilter('statusFilter', '')}
              />
            </Badge>
          )}
          {filters.tagFilter && (
            <Badge variant="secondary" className="text-xs">
              Tag: {filters.tagFilter}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => updateFilter('tagFilter', '')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
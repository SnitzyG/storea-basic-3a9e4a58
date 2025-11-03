import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, Save } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FilterConfig {
  status: string;
  project_type: string;
  priority: string;
  budget_min: string;
  budget_max: string;
  date_from: string;
  date_to: string;
  architectural_stage: string;
  search: string;
}

interface SavedFilter {
  id: string;
  name: string;
  config: FilterConfig;
}

interface ProjectFiltersPanelProps {
  filters: FilterConfig;
  onFilterChange: (filters: FilterConfig) => void;
  onSaveFilter?: (name: string, config: FilterConfig) => void;
  savedFilters?: SavedFilter[];
  onLoadFilter?: (config: FilterConfig) => void;
}

export const ProjectFiltersPanel: React.FC<ProjectFiltersPanelProps> = ({
  filters,
  onFilterChange,
  onSaveFilter,
  savedFilters = [],
  onLoadFilter
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filterName, setFilterName] = useState('');

  const handleFilterChange = (key: keyof FilterConfig, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const handleClearFilters = () => {
    onFilterChange({
      status: 'all',
      project_type: 'all',
      priority: 'all',
      budget_min: '',
      budget_max: '',
      date_from: '',
      date_to: '',
      architectural_stage: 'all',
      search: ''
    });
  };

  const handleSaveFilter = () => {
    if (filterName && onSaveFilter) {
      onSaveFilter(filterName, filters);
      setFilterName('');
    }
  };

  const activeFilterCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'search') return value !== '';
    return value !== 'all' && value !== '';
  }).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects by name, address, description..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 max-h-[500px] overflow-y-auto" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Advanced Filters</h4>
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Project Type Filter */}
              <div className="space-y-2">
                <Label>Project Type</Label>
                <Select value={filters.project_type} onValueChange={(value) => handleFilterChange('project_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="residential_new">Residential New Build</SelectItem>
                    <SelectItem value="residential_renovation">Residential Renovation</SelectItem>
                    <SelectItem value="commercial_new">Commercial New Build</SelectItem>
                    <SelectItem value="commercial_renovation">Commercial Renovation</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={filters.priority} onValueChange={(value) => handleFilterChange('priority', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Architectural Stage Filter */}
              <div className="space-y-2">
                <Label>Architectural Stage</Label>
                <Select value={filters.architectural_stage} onValueChange={(value) => handleFilterChange('architectural_stage', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="Concept">Concept</SelectItem>
                    <SelectItem value="Schematic Design">Schematic Design</SelectItem>
                    <SelectItem value="Design Development">Design Development</SelectItem>
                    <SelectItem value="Tender">Tender</SelectItem>
                    <SelectItem value="Construction Documentation">Construction Documentation</SelectItem>
                    <SelectItem value="Contract Admin">Contract Admin</SelectItem>
                    <SelectItem value="Site Services">Site Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget Range */}
              <div className="space-y-2">
                <Label>Budget Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.budget_min}
                    onChange={(e) => handleFilterChange('budget_min', e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.budget_max}
                    onChange={(e) => handleFilterChange('budget_max', e.target.value)}
                  />
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    placeholder="From"
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="To"
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  />
                </div>
              </div>

              {/* Save Filter Preset */}
              {onSaveFilter && (
                <div className="space-y-2 pt-4 border-t">
                  <Label>Save Filter Preset</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Filter name..."
                      value={filterName}
                      onChange={(e) => setFilterName(e.target.value)}
                    />
                    <Button size="sm" onClick={handleSaveFilter} disabled={!filterName}>
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Saved Filters */}
        {savedFilters.length > 0 && onLoadFilter && (
          <div className="flex gap-2">
            {savedFilters.map((saved) => (
              <Button
                key={saved.id}
                variant="outline"
                size="sm"
                onClick={() => onLoadFilter(saved.config)}
              >
                {saved.name}
              </Button>
            ))}
          </div>
        )}

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex gap-2 flex-wrap">
          {filters.status !== 'all' && (
            <Badge variant="secondary">
              Status: {filters.status}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => handleFilterChange('status', 'all')}
              />
            </Badge>
          )}
          {filters.project_type !== 'all' && (
            <Badge variant="secondary">
              Type: {filters.project_type}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => handleFilterChange('project_type', 'all')}
              />
            </Badge>
          )}
          {filters.priority !== 'all' && (
            <Badge variant="secondary">
              Priority: {filters.priority}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => handleFilterChange('priority', 'all')}
              />
            </Badge>
          )}
          {filters.architectural_stage !== 'all' && (
            <Badge variant="secondary">
              Stage: {filters.architectural_stage}
              <X 
                className="h-3 w-3 ml-1 cursor-pointer" 
                onClick={() => handleFilterChange('architectural_stage', 'all')}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

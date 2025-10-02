import React from 'react';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface EnhancedDocumentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedProject: string;
  onProjectChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedOwner: string;
  onOwnerChange: (value: string) => void;
  visibilityFilter: string;
  onVisibilityFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (order: 'asc' | 'desc') => void;
  projects: Array<{ id: string; name: string; }>;
  teamMembers: Array<{ user_id: string; name: string; }>;
  categories: string[];
  documentCounts: {
    total: number;
    'For Tender': number;
    'For Information': number;
    'For Construction': number;
  };
}


const sortOptions = [
  { value: 'name', label: 'Document Name' },
  { value: 'document_number', label: 'Document Number' },
  { value: 'version', label: 'Revision' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'updated_at', label: 'Updated Date' },
  { value: 'status', label: 'Status' }
];

export const EnhancedDocumentFilters: React.FC<EnhancedDocumentFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedProject,
  onProjectChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedOwner,
  onOwnerChange,
  visibilityFilter,
  onVisibilityFilterChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  projects,
  teamMembers,
  categories,
  documentCounts
}) => {
  return (
    <div className="space-y-4">
      {/* Enhanced Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Search by name, category, document number, revision..." 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="pl-10" 
          />
        </div>
        
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={onSortByChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
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
            onClick={() => onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedProject} onValueChange={onProjectChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Projects</SelectItem>
            {projects.map(project => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={onStatusChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="For Tender">For Tender</SelectItem>
            <SelectItem value="For Information">For Information</SelectItem>
            <SelectItem value="For Construction">For Construction</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedOwner} onValueChange={onOwnerChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Owners" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Owners</SelectItem>
            {teamMembers.map(member => (
              <SelectItem key={member.user_id} value={member.user_id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={visibilityFilter} onValueChange={onVisibilityFilterChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Documents</SelectItem>
            <SelectItem value="project">Project Documents</SelectItem>
            <SelectItem value="private">Private Documents</SelectItem>
            <SelectItem value="shared">Shared with Me</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status Counts */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">
          Total: {documentCounts.total}
        </Badge>
        <Badge variant="outline">
          For Tender: {documentCounts['For Tender']}
        </Badge>
        <Badge variant="secondary">
          For Information: {documentCounts['For Information']}
        </Badge>
        <Badge variant="default">
          For Construction: {documentCounts['For Construction']}
        </Badge>
      </div>
    </div>
  );
};
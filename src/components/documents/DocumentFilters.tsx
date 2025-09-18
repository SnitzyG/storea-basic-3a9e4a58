import React from 'react';
import { Search, Filter, Grid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
interface DocumentFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  selectedFileType: string;
  onFileTypeChange: (value: string) => void;
  selectedUploadedBy: string;
  onUploadedByChange: (value: string) => void;
  selectedRevision: string;
  onRevisionChange: (value: string) => void;
  documentCounts: {
    total: number;
    'For Tender': number;
    'For Information': number;
    'For Construction': number;
  };
  availableFileTypes: string[];
  availableUploaders: { id: string; name: string; role: string }[];
  availableRevisions: number[];
}
const categories = [{
  value: 'all',
  label: 'All Categories'
}, {
  value: 'Architectural',
  label: 'Architectural'
}, {
  value: 'Structural',
  label: 'Structural'
}, {
  value: 'Permit',
  label: 'Permit'
}];
export const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  selectedFileType,
  onFileTypeChange,
  selectedUploadedBy,
  onUploadedByChange,
  selectedRevision,
  onRevisionChange,
  documentCounts,
  availableFileTypes,
  availableUploaders,
  availableRevisions
}) => {
  return <div className="space-y-4">
      {/* Search and View Toggle */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Search by name, category, document number, revision..." value={searchTerm} onChange={e => onSearchChange(e.target.value)} className="pl-10" />
        </div>
        
        <div className="flex items-center gap-2">
          {/* List View button removed as requested */}
        </div>
      </div>

      {/* All Filters in One Row */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>)}
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

        <Select value={selectedFileType} onValueChange={onFileTypeChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All File Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All File Types</SelectItem>
            {availableFileTypes.map(fileType => (
              <SelectItem key={fileType} value={fileType}>
                {fileType.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedUploadedBy} onValueChange={onUploadedByChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Uploaders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Uploaders</SelectItem>
            {availableUploaders.map(uploader => (
              <SelectItem key={uploader.id} value={uploader.id}>
                <div className="flex items-center gap-2">
                  <span>{uploader.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {uploader.role}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedRevision} onValueChange={onRevisionChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Revisions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Revisions</SelectItem>
            {availableRevisions.map(revision => (
              <SelectItem key={revision} value={revision.toString()}>
                Revision {revision}
              </SelectItem>
            ))}
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
    </div>;
};
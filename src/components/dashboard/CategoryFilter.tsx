import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Filter } from 'lucide-react';
import { CATEGORY_OPTIONS } from '@/lib/calendarUtils';
import { Badge } from '@/components/ui/badge';

interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoryChange: (categories: string[]) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategories,
  onCategoryChange,
}) => {
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const selectAll = () => {
    onCategoryChange(CATEGORY_OPTIONS.map(c => c.value));
  };

  const clearAll = () => {
    onCategoryChange([]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1">
          <Filter className="h-3 w-3" />
          Filter
          {selectedCategories.length > 0 && selectedCategories.length < CATEGORY_OPTIONS.length && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
              {selectedCategories.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Filter by Category</h4>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={selectAll}
              >
                All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={clearAll}
              >
                None
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            {CATEGORY_OPTIONS.map((category) => (
              <div key={category.value} className="flex items-center gap-2">
                <Checkbox
                  id={category.value}
                  checked={selectedCategories.includes(category.value)}
                  onCheckedChange={() => toggleCategory(category.value)}
                />
                <Label
                  htmlFor={category.value}
                  className="flex items-center gap-2 text-sm cursor-pointer"
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

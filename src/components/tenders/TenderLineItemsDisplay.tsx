import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTenderLineItems } from '@/hooks/useTenderLineItems';
import { ArrowUpDown, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface TenderLineItemsDisplayProps {
  tenderId: string;
}

export const TenderLineItemsDisplay = ({ tenderId }: TenderLineItemsDisplayProps) => {
  const { lineItems, loading } = useTenderLineItems(tenderId);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'line' | 'category' | 'description'>('line');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState({
    lineNumber: true,
    itemDescription: true,
    specification: true,
    unitOfMeasure: true,
    quantity: true,
    unitPrice: true,
    total: true
  });

  const toggleColumn = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  const getFilteredAndSortedItems = () => {
    let filtered = lineItems;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'line') {
        comparison = a.line_number - b.line_number;
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortBy === 'description') {
        comparison = a.item_description.localeCompare(b.item_description);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Building Quote - Line Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (lineItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Building Quote - Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No line items yet. Upload drawings in Step 2 to extract line items.
          </p>
        </CardContent>
      </Card>
    );
  }

  const categories = ['all', ...Array.from(new Set(lineItems.map(item => item.category)))];
  const displayedItems = getFilteredAndSortedItems();
  const totalValue = displayedItems.reduce((sum, item) => sum + Number(item.total), 0);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Building Quote - Line Items ({displayedItems.length})</span>
            <Badge variant="outline" className="text-lg font-semibold">
              Total: ${totalValue.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter and Sort */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Label>Category:</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <Label>Sort by:</Label>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Number</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>

          {/* Column Visibility */}
          <div className="flex flex-wrap gap-4">
            <Label className="font-semibold">Show/Hide Columns:</Label>
            {Object.entries(visibleColumns).map(([column, visible]) => (
              <div key={column} className="flex items-center gap-2">
                <Checkbox
                  id={column}
                  checked={visible}
                  onCheckedChange={() => toggleColumn(column as keyof typeof visibleColumns)}
                />
                <Label htmlFor={column} className="cursor-pointer font-normal text-sm">
                  {column.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Line Items Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleColumns.lineNumber && <TableHead className="w-20">Line #</TableHead>}
                  {visibleColumns.itemDescription && <TableHead>Item Description</TableHead>}
                  {visibleColumns.specification && <TableHead>Specification/Notes</TableHead>}
                  {visibleColumns.unitOfMeasure && <TableHead className="w-32">Unit</TableHead>}
                  {visibleColumns.quantity && <TableHead className="w-24 text-right">Quantity</TableHead>}
                  {visibleColumns.unitPrice && <TableHead className="w-32 text-right">Unit Price</TableHead>}
                  {visibleColumns.total && <TableHead className="w-32 text-right">Total</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedItems.map((item) => (
                  <TableRow key={item.id}>
                    {visibleColumns.lineNumber && (
                      <TableCell className="font-medium">{item.line_number}</TableCell>
                    )}
                    {visibleColumns.itemDescription && (
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.item_description}</div>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {item.category}
                          </Badge>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.specification && (
                      <TableCell className="text-sm text-muted-foreground max-w-xs">
                        {item.specification}
                      </TableCell>
                    )}
                    {visibleColumns.unitOfMeasure && (
                      <TableCell>{item.unit_of_measure}</TableCell>
                    )}
                    {visibleColumns.quantity && (
                      <TableCell className="text-right">
                        {item.quantity ? Number(item.quantity).toLocaleString() : '-'}
                      </TableCell>
                    )}
                    {visibleColumns.unitPrice && (
                      <TableCell className="text-right">
                        {item.unit_price 
                          ? `$${Number(item.unit_price).toLocaleString('en-AU', { minimumFractionDigits: 2 })}`
                          : '-'
                        }
                      </TableCell>
                    )}
                    {visibleColumns.total && (
                      <TableCell className="text-right font-semibold">
                        ${Number(item.total).toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Eye, EyeOff, ArrowUpDown, Filter } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface LineItem {
  lineNumber: number;
  itemDescription: string;
  specification: string;
  unitOfMeasure: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
}

interface DrawingsUploadManagerProps {
  projectId: string;
  tenderId?: string;
  onLineItemsImported?: (items: LineItem[]) => void;
}

export const DrawingsUploadManager = ({ projectId, tenderId, onLineItemsImported }: DrawingsUploadManagerProps) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Project specs
  const [projectSpecs, setProjectSpecs] = useState({
    totalArea: '',
    floors: '',
    bedrooms: '',
    bathrooms: '',
    buildingType: '',
    constructionType: ''
  });
  
  // Filters and display options
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setUploading(true);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${projectId}/drawings/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get signed URL (valid for 1 hour) for private bucket access
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError) throw signedUrlError;

      // Call edge function to parse the document
      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-line-items', {
        body: {
          fileUrl: signedUrlData.signedUrl,
          fileName: file.name
        }
      });

      if (parseError) throw parseError;

      // Transform parsed data into line items
      const parsedItems: LineItem[] = parseData.lineItems.map((item: any, index: number) => ({
        lineNumber: item.item_number || index + 1,
        itemDescription: item.item_name || '',
        specification: item.description || item.notes || '',
        unitOfMeasure: item.unit || 'ea',
        quantity: item.quantity || 0,
        unitPrice: item.rate || 0,
        total: item.total || 0,
        category: item.category || 'General'
      }));

      setLineItems(parsedItems);
      onLineItemsImported?.(parsedItems);

      // If tenderId is provided, save to database
      if (tenderId) {
        await supabase.from('tender_line_items').delete().eq('tender_id', tenderId);
        
        const { error: insertError } = await supabase.from('tender_line_items').insert(
          parsedItems.map(item => ({
            tender_id: tenderId,
            line_number: item.lineNumber,
            item_description: item.itemDescription,
            specification: item.specification,
            unit_of_measure: item.unitOfMeasure,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total: item.total,
            category: item.category
          }))
        );

        if (insertError) {
          console.error('Error saving to database:', insertError);
          toast({
            title: 'Warning',
            description: 'Line items displayed but not saved to tender',
            variant: 'destructive'
          });
        }
      }

      toast({
        title: 'Drawings parsed successfully',
        description: `Extracted ${parsedItems.length} line items from the document`
      });

    } catch (error: any) {
      console.error('Error uploading/parsing drawings:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to parse drawings',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

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
        comparison = a.lineNumber - b.lineNumber;
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortBy === 'description') {
        comparison = a.itemDescription.localeCompare(b.itemDescription);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  };

  const categories = ['all', ...Array.from(new Set(lineItems.map(item => item.category)))];
  const displayedItems = getFilteredAndSortedItems();
  const totalValue = displayedItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Construction Drawings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".pdf,.xlsx,.xls,.docx,.doc"
              onChange={handleFileUpload}
              disabled={uploading}
              className="flex-1"
            />
            {uploadedFile && (
              <Badge variant="secondary" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {uploadedFile.name}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Upload PDF or Excel files containing: site plan, floor plan, roof plan, elevations, sections, setout plan, and window/door schedules
          </p>
        </CardContent>
      </Card>

      {/* Project Specifications */}
      <Card>
        <CardHeader>
          <CardTitle>Key Project Specifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Total Floor Area (m²)</Label>
              <Input
                value={projectSpecs.totalArea}
                onChange={(e) => setProjectSpecs({ ...projectSpecs, totalArea: e.target.value })}
                placeholder="250"
              />
            </div>
            <div>
              <Label>Number of Floors</Label>
              <Input
                value={projectSpecs.floors}
                onChange={(e) => setProjectSpecs({ ...projectSpecs, floors: e.target.value })}
                placeholder="2"
              />
            </div>
            <div>
              <Label>Bedrooms</Label>
              <Input
                value={projectSpecs.bedrooms}
                onChange={(e) => setProjectSpecs({ ...projectSpecs, bedrooms: e.target.value })}
                placeholder="4"
              />
            </div>
            <div>
              <Label>Bathrooms</Label>
              <Input
                value={projectSpecs.bathrooms}
                onChange={(e) => setProjectSpecs({ ...projectSpecs, bathrooms: e.target.value })}
                placeholder="2"
              />
            </div>
            <div>
              <Label>Building Type</Label>
              <Select value={projectSpecs.buildingType} onValueChange={(v) => setProjectSpecs({ ...projectSpecs, buildingType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="mixed">Mixed Use</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Construction Type</Label>
              <Select value={projectSpecs.constructionType} onValueChange={(v) => setProjectSpecs({ ...projectSpecs, constructionType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="brick">Brick Veneer</SelectItem>
                  <SelectItem value="timber">Timber Frame</SelectItem>
                  <SelectItem value="concrete">Concrete</SelectItem>
                  <SelectItem value="steel">Steel Frame</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Items Display */}
      {lineItems.length > 0 && (
        <>
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Line Items ({displayedItems.length})</span>
                <Badge variant="outline" className="text-lg font-semibold">
                  Total: ${totalValue.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filter and Sort */}
              <div className="flex items-center gap-4">
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
                    <Label htmlFor={column} className="cursor-pointer font-normal">
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
                    {displayedItems.map((item, index) => (
                      <TableRow key={index}>
                        {visibleColumns.lineNumber && (
                          <TableCell className="font-medium">{item.lineNumber}</TableCell>
                        )}
                        {visibleColumns.itemDescription && (
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.itemDescription}</div>
                              <Badge variant="secondary" className="text-xs mt-1">
                                {item.category}
                              </Badge>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.specification && (
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {item.specification}
                          </TableCell>
                        )}
                        {visibleColumns.unitOfMeasure && (
                          <TableCell>{item.unitOfMeasure}</TableCell>
                        )}
                        {visibleColumns.quantity && (
                          <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
                        )}
                        {visibleColumns.unitPrice && (
                          <TableCell className="text-right">
                            ${item.unitPrice.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                          </TableCell>
                        )}
                        {visibleColumns.total && (
                          <TableCell className="text-right font-semibold">
                            ${item.total.toLocaleString('en-AU', { minimumFractionDigits: 2 })}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

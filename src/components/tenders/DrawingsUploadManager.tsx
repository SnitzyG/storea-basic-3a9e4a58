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
import { Upload, FileText, ArrowUpDown, Filter } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { StorealiteLogo } from '@/components/ui/storealite-logo';
import { Progress } from '@/components/ui/progress';
// PDF rendering for client-side PDF -> image conversion
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - Vite will resolve this to a URL
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;

interface LineItem {
  id: string;
  lineNumber: number;
  itemDescription: string;
  specification: string;
  unitOfMeasure: string;
  quantity: number;
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const allSelected = selectedIds.size > 0 && selectedIds.size === lineItems.length;
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(lineItems.map(li => li.id)));
  };
  
  // Filters and display options
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'line' | 'category' | 'description'>('line');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [visibleColumns, setVisibleColumns] = useState({
    lineNumber: true,
    itemDescription: true,
    specification: true,
    unitOfMeasure: true,
    quantity: true
  });

  // Standard line items included on every upload
  const STANDARD_LINE_ITEMS = [
    { category: 'Site Preparation', items: ['Site cut / excavation', 'Fill / leveling and compaction', 'Removal of debris / vegetation', 'Temporary fencing', 'Sediment control / silt fencing', 'Surveying and set-out costs', 'Soil testing (geotechnical report)'] },
    { category: 'Foundations and Slab', items: ['Footings (strip or pier)', 'Concrete slab (waffle, raft, or conventional)', 'Reinforcement (steel mesh, bar chairs)', 'Vapour barrier', 'Termite protection', 'Edge insulation (if energy requirement)', 'Engineering certification'] },
    { category: 'Structural Frame', items: ['Timber or steel frame supply and installation', 'Roof trusses and bracing', 'Wall framing', 'Load-bearing beams / lintels', 'Floor system (if double storey – joists, bearers, flooring sheets)'] },
    { category: 'External Elements', items: ['Roof sheeting or tiles', 'Fascia, gutters, and downpipes', 'Wall cladding (brick veneer, render, weatherboard, etc.)', 'External doors and windows (including flyscreens and locks)', 'Eaves, soffits, and gable treatments', 'External painting or coating system'] },
    { category: 'Services Rough-In', items: ['Electrical rough-in (power, lighting, switchboard)', 'Plumbing rough-in (hot/cold water, waste, gas)', 'HVAC / ducted system rough-in', 'NBN / data provisions', 'Meter installation (electricity, gas, water)'] },
    { category: 'Internal Construction', items: ['Internal wall linings (plasterboard)', 'Cornices, architraves, skirting', 'Internal doors and hardware', 'Staircase (if applicable)', 'Insulation (walls, ceiling, underfloor)'] },
    { category: 'Wet Areas', items: ['Waterproofing membranes', 'Tiling (floor and wall)', 'Sanitaryware (toilets, basins, baths, showers)', 'Tapware', 'Kitchen cabinetry and benchtops', 'Appliances (oven, cooktop, rangehood, dishwasher)', 'Laundry tub and cabinetry'] },
    { category: 'Finishes', items: ['Internal painting (walls, ceilings, trims)', 'Floor coverings (tiles, carpet, vinyl, hybrid, etc.)', 'Wardrobes and shelving', 'Mirrors, towel rails, robe hooks', 'Light fittings and switches (often allowance or PC item)'] },
    { category: 'External Works', items: ['Driveway and paths', 'Letterbox', 'Clothesline', 'Landscaping (turf, plants, mulch)', 'Fencing and gates', 'Crossover reinstatement (if damaged)', 'Stormwater drainage and connection to legal point of discharge'] },
    { category: 'Permits & Compliance', items: ['Building permit and inspections', 'Energy rating report / compliance', 'Engineering and architectural drawings', 'Warranty insurance', 'Site management / supervision', 'Waste removal / site clean', 'Temporary power and water supply', "Builder's margin and contingency"] },
    { category: 'Provisional Sums & PC Items', items: ['Floor tiles and wall tiles (per m² allowance)', 'Tapware and fittings (per item allowance)', 'Kitchen and bathroom fixtures (allowance-based)', 'Landscaping (provisional sum)', 'Site works (if soil conditions unknown)'] },
    { category: 'Handover', items: ['Final clean', 'Occupancy permit', 'Handover inspection', 'Warranty documents and manuals', 'Keys and remotes', 'Defects liability period'] }
  ];

  // Convert first few PDF pages to images for AI analysis
  const pdfToImages = async (file: File, maxPages = 5): Promise<Blob[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
    const blobs: Blob[] = [];
    const pages = Math.min(pdf.numPages, maxPages);
    for (let i = 1; i <= pages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context as any, viewport }).promise;
      const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.9));
      if (blob) blobs.push(blob);
    }
    return blobs;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setUploading(true);
    setUploadProgress(0);
    setUploadStage('Uploading file...');

    try {
      // Upload file to storage
      setUploadProgress(10);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${projectId}/drawings/${fileName}`;

      setUploadProgress(20);
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      setUploadProgress(30);
      setUploadStage('Processing file...');
      
      // Get signed URL (valid for 1 hour) for private bucket access
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError) throw signedUrlError;

      // Build payload for edge function; for PDFs render pages to images
      const isPdf = (fileExt?.toLowerCase() === 'pdf') || file.type === 'application/pdf';
      let invokeBody: any = {
        fileName: file.name,
        bucket: 'documents',
        filePath
      };

      if (isPdf) {
        setUploadProgress(40);
        setUploadStage('Converting PDF pages to images...');
        const pageBlobs = await pdfToImages(file, 5);
        setUploadProgress(50);
        setUploadStage('Uploading page images...');
        const imageUrls: string[] = [];
        for (let i = 0; i < pageBlobs.length; i++) {
          const pagePath = `${projectId}/drawings/pages/${Date.now()}_${i + 1}.png`;
          const { error: upErr } = await supabase.storage
            .from('documents')
            .upload(pagePath, pageBlobs[i], { contentType: 'image/png', upsert: true } as any);
          if (upErr) throw upErr;
          const { data: pageSigned, error: signErr } = await supabase.storage
            .from('documents')
            .createSignedUrl(pagePath, 3600);
          if (signErr) throw signErr;
          imageUrls.push(pageSigned.signedUrl);
          setUploadProgress(50 + (i + 1) * (20 / pageBlobs.length));
        }
        invokeBody.imageUrls = imageUrls;
      } else {
        invokeBody.fileUrl = signedUrlData.signedUrl;
      }

      setUploadProgress(70);
      setUploadStage('Analyzing construction drawings...');

      // Call edge function to parse the document/images
      const { data: parseData, error: parseError } = await supabase.functions.invoke('parse-line-items', {
        body: invokeBody
      });

      if (parseError) throw parseError;

      setUploadProgress(85);
      setUploadStage('Extracting line items...');

      // Create standard line items
      let lineNum = 1;
      const standardItems: LineItem[] = [];
      STANDARD_LINE_ITEMS.forEach(group => {
        group.items.forEach(item => {
          standardItems.push({
            id: `std-${lineNum}`,
            lineNumber: lineNum++,
            itemDescription: item,
            specification: '',
            unitOfMeasure: 'item',
            quantity: 1,
            category: group.category
          });
        });
      });

      // Add any AI-extracted items
      const aiItems: LineItem[] = parseData.lineItems?.map((item: any, index: number) => ({
        id: `ai-${index}`,
        lineNumber: lineNum++,
        itemDescription: item.item_description ?? '',
        specification: item.specification ?? item.description ?? item.notes ?? '',
        unitOfMeasure: item.unit_of_measure ?? item.unit ?? 'item',
        quantity: Number(item.quantity ?? 1),
        category: item.category ?? 'Additional Items'
      })) || [];

      const allItems = [...standardItems, ...aiItems];
      setLineItems(allItems);
      setSelectedIds(new Set(allItems.map(i => i.id)));
      onLineItemsImported?.(allItems);

      setUploadProgress(95);
      setUploadStage('Saving to database...');

      // If tenderId is provided, save ALL extracted items initially
      if (tenderId) {
        await supabase.from('tender_line_items').delete().eq('tender_id', tenderId);
        
        const { error: insertError } = await supabase.from('tender_line_items').insert(
          allItems.map(item => ({
            tender_id: tenderId,
            line_number: item.lineNumber,
            item_description: item.itemDescription,
            specification: item.specification,
            unit_of_measure: item.unitOfMeasure,
            quantity: item.quantity,
            unit_price: 0,
            total: 0,
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
      } else {
        toast({
          title: 'Line items not saved',
          description: 'Save the tender draft first, then use “Save Selected Items to Tender”.',
        });
      }


      setUploadProgress(100);
      setUploadStage('Complete!');

      toast({
        title: 'Tender package created successfully',
        description: `Created ${allItems.length} line items ready for tender`
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

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: `custom-${Date.now()}`,
      lineNumber: lineItems.length + 1,
      itemDescription: 'New item',
      specification: '',
      unitOfMeasure: 'item',
      quantity: 1,
      category: 'Additional Items'
    };
    setLineItems(prev => [...prev, newItem]);
  };

  const deleteLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id).map((item, idx) => ({
      ...item,
      lineNumber: idx + 1
    })));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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

  return (
    <>
      {/* Full-screen upload overlay */}
      {uploading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-8 max-w-md w-full px-4">
            <div className="animate-pulse">
              <StorealiteLogo className="text-7xl" />
            </div>
            <div className="w-full space-y-3">
              <Progress value={uploadProgress} className="h-3" />
              <p className="text-center text-lg font-medium text-muted-foreground">
                {uploadStage}
              </p>
              <p className="text-center text-3xl font-bold">
                {uploadProgress}%
              </p>
            </div>
          </div>
        </div>
      )}

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


      {/* Line Items Display */}
      {lineItems.length > 0 && (
        <>
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tender Line Items ({displayedItems.length})</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Selected: {selectedIds.size}</span>
                  <Button onClick={addLineItem} size="sm">Add Line Item</Button>
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      if (!tenderId) {
                        toast({ title: 'Save draft first', description: 'Save the tender to enable saving selected items.', variant: 'destructive' });
                        return;
                      }
                      const selected = lineItems.filter(li => selectedIds.has(li.id));
                      if (selected.length === 0) {
                        toast({ title: 'No items selected', description: 'Select at least one line item to save.', variant: 'destructive' });
                        return;
                      }
                      await supabase.from('tender_line_items').delete().eq('tender_id', tenderId);
                      const { error } = await supabase.from('tender_line_items').insert(selected.map(item => ({
                        tender_id: tenderId,
                        line_number: item.lineNumber,
                        item_description: item.itemDescription,
                        specification: item.specification,
                        unit_of_measure: item.unitOfMeasure,
                        quantity: item.quantity,
                        unit_price: 0,
                        total: 0,
                        category: item.category
                      })));
                      if (error) {
                        toast({ title: 'Save failed', description: 'Could not save selected items.', variant: 'destructive' });
                      } else {
                        toast({ title: 'Saved', description: `Saved ${selected.length} selected items to tender.` });
                      }
                    }}
                  >
                    Save Selected Items to Tender
                  </Button>
                </div>
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
                      <TableHead className="w-10">
                        <Checkbox
                          aria-label="Select all"
                          checked={allSelected}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      {visibleColumns.lineNumber && <TableHead className="w-20">Line #</TableHead>}
                      {visibleColumns.itemDescription && <TableHead>Item Description</TableHead>}
                      {visibleColumns.specification && <TableHead>Specification/Notes</TableHead>}
                      {visibleColumns.unitOfMeasure && <TableHead className="w-32">Unit</TableHead>}
                      {visibleColumns.quantity && <TableHead className="w-32">Quantity</TableHead>}
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="w-10">
                          <Checkbox
                            aria-label={`Select ${item.itemDescription}`}
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                          />
                        </TableCell>
                        {visibleColumns.lineNumber && (
                          <TableCell className="font-medium">{item.lineNumber}</TableCell>
                        )}
                        {visibleColumns.itemDescription && (
                          <TableCell>
                            <div className="space-y-2">
                              <Input
                                value={item.itemDescription}
                                onChange={(e) => updateLineItem(item.id, 'itemDescription', e.target.value)}
                                className="font-medium"
                              />
                              <Select 
                                value={item.category} 
                                onValueChange={(v) => updateLineItem(item.id, 'category', v)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {STANDARD_LINE_ITEMS.map(group => (
                                    <SelectItem key={group.category} value={group.category}>
                                      {group.category}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="Additional Items">Additional Items</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                        )}
                        {visibleColumns.specification && (
                          <TableCell>
                            <Textarea
                              value={item.specification}
                              onChange={(e) => updateLineItem(item.id, 'specification', e.target.value)}
                              className="min-h-[60px]"
                              placeholder="Add specifications or notes..."
                            />
                          </TableCell>
                        )}
                        {visibleColumns.unitOfMeasure && (
                          <TableCell>
                            <Input
                              value={item.unitOfMeasure}
                              onChange={(e) => updateLineItem(item.id, 'unitOfMeasure', e.target.value)}
                            />
                          </TableCell>
                        )}
                        {visibleColumns.quantity && (
                          <TableCell>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(item.id, 'quantity', Number(e.target.value))}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteLineItem(item.id)}
                          >
                            Delete
                          </Button>
                        </TableCell>
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
    </>
  );
};

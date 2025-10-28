import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Edit, Trash } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineItemImporter } from './LineItemImporter';

interface LineItem {
  id: string;
  item_number: number;
  item_name: string;
  description: string | null;
  category: string;
  quantity: number | null;
  unit: string | null;
  rate: number | null;
  total: number | null;
  contract_budget: number;
  revised_budget: number | null;
  percentage_complete: number;
  total_claimed_to_date: number;
  balance_to_claim: number;
  forecast_to_complete: number | null;
  notes: string | null;
}

interface LineItemBudgetsProps {
  projectId: string;
  userRole: string;
}

const CATEGORIES = [
  'Preliminaries',
  'Demolition',
  'Excavation',
  'Concrete',
  'Steelwork',
  'Carpentry',
  'Roofing',
  'Windows & Doors',
  'Plumbing',
  'Electrical',
  'Mechanical',
  'Internal Finishes',
  'External Works',
  'General',
];

export function LineItemBudgets({ projectId, userRole }: LineItemBudgetsProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    item_name: '',
    description: '',
    category: 'General',
    quantity: '',
    unit: '',
    rate: '',
    contract_budget: '',
    notes: '',
  });

  const canManageItems = ['architect', 'contractor', 'builder'].includes(userRole);

  const fetchLineItems = async () => {
    try {
      const { data, error } = await supabase
        .from('line_item_budgets')
        .select('*')
        .eq('project_id', projectId)
        .order('item_number', { ascending: true });

      if (error) throw error;
      setLineItems(data || []);
    } catch (error) {
      console.error('Error fetching line items:', error);
      toast({
        title: "Error",
        description: "Failed to fetch line items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLineItems();
  }, [projectId]);

  const handleCreateLineItem = async () => {
    try {
      const nextItemNumber = lineItems.length > 0 
        ? Math.max(...lineItems.map(item => item.item_number)) + 1 
        : 1;

      const contractBudget = parseFloat(formData.contract_budget) || 0;
      const quantity = formData.quantity ? parseFloat(formData.quantity) : null;
      const rate = formData.rate ? parseFloat(formData.rate) : null;
      
      const { error } = await supabase
        .from('line_item_budgets')
        .insert({
          project_id: projectId,
          item_number: nextItemNumber,
          item_name: formData.item_name,
          description: formData.description || null,
          category: formData.category,
          quantity,
          unit: formData.unit || null,
          rate,
          total: contractBudget,
          contract_budget: contractBudget,
          balance_to_claim: contractBudget,
          notes: formData.notes || null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Line item created successfully",
      });

      setCreateDialogOpen(false);
      setFormData({ 
        item_name: '', 
        description: '', 
        category: 'General', 
        quantity: '', 
        unit: '', 
        rate: '', 
        contract_budget: '',
        notes: '' 
      });
      fetchLineItems();
    } catch (error) {
      console.error('Error creating line item:', error);
      toast({
        title: "Error",
        description: "Failed to create line item",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTotalBudget = () => {
    return lineItems.reduce((sum, item) => sum + (item.revised_budget || item.contract_budget), 0);
  };

  const getTotalClaimed = () => {
    return lineItems.reduce((sum, item) => sum + item.total_claimed_to_date, 0);
  };

  const getTotalBalance = () => {
    return lineItems.reduce((sum, item) => sum + item.balance_to_claim, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Line Item Budgets</CardTitle>
            <CardDescription>Detailed breakdown of project costs by line item</CardDescription>
          </div>
          {canManageItems && (
            <div className="flex gap-2">
              <LineItemImporter projectId={projectId} onImportComplete={fetchLineItems} />
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Line Item</DialogTitle>
                  <DialogDescription>Create a new budget line item</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="item-name">Item Name</Label>
                    <Input
                      id="item-name"
                      value={formData.item_name}
                      onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                      placeholder="e.g., Foundation Work"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="budget">Contract Budget</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={formData.contract_budget}
                      onChange={(e) => setFormData({ ...formData, contract_budget: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateLineItem}>Add Item</Button>
                </DialogFooter>
              </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {lineItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No line items yet</p>
            {canManageItems && <p className="text-sm">Add your first line item to get started</p>}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Claimed</TableHead>
                    <TableHead>%</TableHead>
                    {canManageItems && <TableHead></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.item_number}</TableCell>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                        {item.description || '-'}
                      </TableCell>
                      <TableCell><span className="text-xs px-2 py-1 bg-muted rounded">{item.category}</span></TableCell>
                      <TableCell className="text-right">{item.quantity || '-'}</TableCell>
                      <TableCell>{item.unit || '-'}</TableCell>
                      <TableCell className="text-right">{item.rate ? formatCurrency(item.rate) : '-'}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(item.total || item.contract_budget)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.total_claimed_to_date)}</TableCell>
                      <TableCell><span className="text-xs font-medium">{item.percentage_complete}%</span></TableCell>
                      {canManageItems && (
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={7}>TOTAL</TableCell>
                    <TableCell className="text-right">{formatCurrency(getTotalBudget())}</TableCell>
                    <TableCell className="text-right">{formatCurrency(getTotalClaimed())}</TableCell>
                    <TableCell colSpan={canManageItems ? 2 : 1}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
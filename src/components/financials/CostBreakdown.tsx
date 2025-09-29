import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CostBreakdownProps {
  projectId: string;
  userRole: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  allocated_amount: number;
  spent_amount: number;
  category_type: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300'];

const DEFAULT_CATEGORIES = [
  { name: 'Labor', type: 'general' },
  { name: 'Materials', type: 'general' },
  { name: 'Permits', type: 'general' },
  { name: 'Subcontractors', type: 'general' },
  { name: 'Design Fees', type: 'general' },
  { name: 'Plumbing', type: 'trade' },
  { name: 'Electrical', type: 'trade' },
  { name: 'Structural', type: 'trade' },
  { name: 'HVAC', type: 'trade' },
  { name: 'Flooring', type: 'trade' }
];

export function CostBreakdown({ projectId, userRole }: CostBreakdownProps) {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'bar' | 'pie'>('table');
  const [categoryType, setCategoryType] = useState<'general' | 'trade' | 'all'>('all');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', allocated: 0, type: 'general' });

  const canManage = ['architect', 'contractor'].includes(userRole);

  useEffect(() => {
    fetchCategories();
  }, [projectId]);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('project_id', projectId)
        .order('name');

      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to load cost breakdown",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;

    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .insert({
          project_id: projectId,
          name: newCategory.name,
          allocated_amount: newCategory.allocated,
          category_type: newCategory.type
        })
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      setNewCategory({ name: '', allocated: 0, type: 'general' });
      setAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Category added successfully"
      });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive"
      });
    }
  };

  const initializeDefaultCategories = async () => {
    try {
      const categoriesToAdd = DEFAULT_CATEGORIES.map(cat => ({
        project_id: projectId,
        name: cat.name,
        allocated_amount: 0,
        category_type: cat.type
      }));

      const { data, error } = await supabase
        .from('budget_categories')
        .insert(categoriesToAdd)
        .select();

      if (error) throw error;

      setCategories(data || []);
      toast({
        title: "Success",
        description: "Default categories created"
      });
    } catch (error) {
      console.error('Error creating default categories:', error);
      toast({
        title: "Error",
        description: "Failed to create categories",
        variant: "destructive"
      });
    }
  };

  const filteredCategories = categories.filter(cat => 
    categoryType === 'all' || cat.category_type === categoryType
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const chartData = filteredCategories.map(cat => ({
    name: cat.name,
    allocated: cat.allocated_amount,
    spent: cat.spent_amount,
    remaining: Math.max(0, cat.allocated_amount - cat.spent_amount)
  }));

  const pieData = filteredCategories.map((cat, index) => ({
    name: cat.name,
    value: cat.spent_amount,
    color: COLORS[index % COLORS.length]
  })).filter(item => item.value > 0);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
            ))}
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
            <CardTitle>Cost Breakdown</CardTitle>
            <CardDescription>Budget allocation and spending by category</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={categoryType} onValueChange={(value: typeof categoryType) => setCategoryType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="trade">Trade</SelectItem>
              </SelectContent>
            </Select>
            {canManage && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Budget Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Category Name</Label>
                      <Input
                        id="name"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="allocated">Allocated Budget</Label>
                      <Input
                        id="allocated"
                        type="number"
                        value={newCategory.allocated}
                        onChange={(e) => setNewCategory(prev => ({ ...prev, allocated: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Category Type</Label>
                      <Select value={newCategory.type} onValueChange={(value) => setNewCategory(prev => ({ ...prev, type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="trade">Trade</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddCategory}>
                        Add Category
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Categories</h3>
            <p className="text-muted-foreground mb-4">Create budget categories to track spending</p>
            {canManage && (
              <div className="space-x-2">
                <Button onClick={initializeDefaultCategories} variant="outline">
                  Create Default Categories
                </Button>
                <Button onClick={() => setAddDialogOpen(true)}>
                  Add Custom Category
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Tabs value={viewMode} onValueChange={(value: typeof viewMode) => setViewMode(value)}>
            <TabsList>
              <TabsTrigger value="table">Table View</TabsTrigger>
              <TabsTrigger value="bar">Bar Chart</TabsTrigger>
              <TabsTrigger value="pie">Pie Chart</TabsTrigger>
            </TabsList>

            <TabsContent value="table" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Allocated</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">% Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => {
                    const percentUsed = category.allocated_amount > 0 
                      ? (category.spent_amount / category.allocated_amount) * 100 
                      : 0;
                    const remaining = category.allocated_amount - category.spent_amount;

                    return (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{category.category_type}</Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(category.allocated_amount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(category.spent_amount)}</TableCell>
                        <TableCell className={`text-right ${remaining < 0 ? 'text-red-600' : ''}`}>
                          {formatCurrency(remaining)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={percentUsed > 100 ? 'destructive' : percentUsed > 90 ? 'secondary' : 'default'}
                          >
                            {percentUsed.toFixed(1)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="bar" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="allocated" fill="#8884d8" name="Allocated" />
                    <Bar dataKey="spent" fill="#82ca9d" name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="pie" className="mt-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
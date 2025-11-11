import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, TrendingUp, TrendingDown, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface BudgetOverviewProps {
  projectId: string;
  userRole: string;
  userId?: string | null;
}

interface Budget {
  id: string;
  original_budget: number;
  revised_budget?: number;
  currency: string;
}

export function BudgetOverview({ projectId, userRole, userId }: BudgetOverviewProps) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editValues, setEditValues] = useState({ original: 0, revised: 0 });

  const canManage = ['architect', 'contractor'].includes(userRole);

  useEffect(() => {
    fetchBudgetData();
  }, [projectId]);

  const fetchBudgetData = async () => {
    try {
      // Fetch budget
      const { data: budgetData } = await supabase
        .from('project_budgets')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (budgetData) {
        setBudget(budgetData);
        setEditValues({
          original: budgetData.original_budget,
          revised: budgetData.revised_budget || budgetData.original_budget
        });
      }

      // Calculate total spent from invoices and payments
      const { data: invoices } = await supabase
        .from('project_invoices')
        .select('amount')
        .eq('project_id', projectId)
        .eq('status', 'paid');

      const spent = invoices?.reduce((sum, invoice) => sum + Number(invoice.amount), 0) || 0;
      setTotalSpent(spent);

    } catch (error) {
      console.error('Error fetching budget data:', error);
      toast({
        title: "Error",
        description: "Failed to load budget data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async () => {
    if (!budget) return;

    try {
      const { error } = await supabase
        .from('project_budgets')
        .update({
          original_budget: editValues.original,
          revised_budget: editValues.revised
        })
        .eq('id', budget.id);

      if (error) throw error;

      setBudget({
        ...budget,
        original_budget: editValues.original,
        revised_budget: editValues.revised
      });
      
      setEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Budget updated successfully"
      });
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive"
      });
    }
  };

  const handleCreateBudget = async () => {
    try {
      const { data, error } = await supabase
        .from('project_budgets')
        .insert({
          project_id: projectId,
          original_budget: editValues.original,
          revised_budget: editValues.revised,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setBudget(data);
      setEditDialogOpen(false);
      toast({
        title: "Success",
        description: "Budget created successfully"
      });
    } catch (error) {
      console.error('Error creating budget:', error);
      toast({
        title: "Error",
        description: "Failed to create budget",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
              <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 bg-muted rounded w-32 animate-pulse mb-2"></div>
              <div className="h-3 bg-muted rounded w-full animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const currentBudget = budget?.revised_budget || budget?.original_budget || 0;
  const remainingBudget = currentBudget - totalSpent;
  const spentPercentage = currentBudget > 0 ? (totalSpent / currentBudget) * 100 : 0;
  const budgetStatus = spentPercentage > 100 ? 'over' : spentPercentage > 90 ? 'critical' : spentPercentage > 75 ? 'warning' : 'good';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: budget?.currency || 'USD'
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Budget Overview</h2>
        {canManage && (
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                {budget ? 'Edit Budget' : 'Set Budget'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{budget ? 'Edit Budget' : 'Set Project Budget'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="original">Original Budget</Label>
                  <Input
                    id="original"
                    type="number"
                    value={editValues.original}
                    onChange={(e) => setEditValues(prev => ({ ...prev, original: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="revised">Revised Budget</Label>
                  <Input
                    id="revised"
                    type="number"
                    value={editValues.revised}
                    onChange={(e) => setEditValues(prev => ({ ...prev, revised: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={budget ? handleUpdateBudget : handleCreateBudget}>
                    {budget ? 'Update' : 'Create'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!budget ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Budget Set</h3>
              <p className="text-muted-foreground mb-4">Set a project budget to track expenses and progress</p>
              {canManage && (
                <Button onClick={() => setEditDialogOpen(true)}>
                  Set Budget
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(currentBudget)}</div>
              {budget.revised_budget && budget.revised_budget !== budget.original_budget && (
                <p className="text-xs text-muted-foreground">
                  Original: {formatCurrency(budget.original_budget)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spent</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSpent)}</div>
              <div className="flex items-center space-x-2 mt-2">
                <Progress value={Math.min(spentPercentage, 100)} className="flex-1" />
                <Badge 
                  variant={budgetStatus === 'good' ? 'default' : budgetStatus === 'warning' ? 'secondary' : 'destructive'}
                >
                  {spentPercentage.toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              {remainingBudget >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(remainingBudget))}
              </div>
              <p className="text-xs text-muted-foreground">
                {remainingBudget >= 0 ? 'Under budget' : 'Over budget'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
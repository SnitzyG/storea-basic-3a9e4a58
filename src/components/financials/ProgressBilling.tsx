import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProgressBillingProps {
  projectId: string;
  userRole: string;
}

interface BillingData {
  projectCompletion: number;
  totalBilled: number;
  totalBudget: number;
  invoicesCount: number;
  paidInvoicesCount: number;
}

export function ProgressBilling({ projectId, userRole }: ProgressBillingProps) {
  const [billingData, setBillingData] = useState<BillingData>({
    projectCompletion: 0,
    totalBilled: 0,
    totalBudget: 0,
    invoicesCount: 0,
    paidInvoicesCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, [projectId]);

  const fetchBillingData = async () => {
    try {
      // Fetch budget data
      const { data: budgetData } = await supabase
        .from('project_budgets')
        .select('original_budget, revised_budget')
        .eq('project_id', projectId)
        .single();

      // Fetch invoice data
      const { data: invoicesData } = await supabase
        .from('project_invoices')
        .select('amount, status')
        .eq('project_id', projectId);

      const totalBudget = budgetData?.revised_budget || budgetData?.original_budget || 0;
      const totalBilled = invoicesData?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
      const invoicesCount = invoicesData?.length || 0;
      const paidInvoicesCount = invoicesData?.filter(inv => inv.status === 'paid').length || 0;

      // For demo purposes, calculate project completion based on paid invoices
      // In a real app, this would come from project management data
      const projectCompletion = totalBudget > 0 ? Math.min((totalBilled / totalBudget) * 100, 100) : 0;

      setBillingData({
        projectCompletion,
        totalBilled,
        totalBudget,
        invoicesCount,
        paidInvoicesCount
      });
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const billingPercentage = billingData.totalBudget > 0 
    ? (billingData.totalBilled / billingData.totalBudget) * 100 
    : 0;

  const billingStatus = billingPercentage > billingData.projectCompletion 
    ? 'ahead' 
    : billingPercentage < billingData.projectCompletion - 10 
    ? 'behind' 
    : 'ontrack';

  const chartData = [
    {
      name: 'Project Progress',
      completion: billingData.projectCompletion,
      billing: billingPercentage
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded animate-pulse"></div>
            <div className="h-64 bg-muted rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Progress</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingData.projectCompletion.toFixed(1)}%</div>
            <Progress value={billingData.projectCompletion} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing Progress</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingPercentage.toFixed(1)}%</div>
            <Progress value={billingPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Billed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(billingData.totalBilled)}</div>
            <p className="text-xs text-muted-foreground">
              of {formatCurrency(billingData.totalBudget)} budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing Status</CardTitle>
            {billingStatus === 'ahead' ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : billingStatus === 'behind' ? (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            ) : (
              <CheckCircle className="h-4 w-4 text-blue-600" />
            )}
          </CardHeader>
          <CardContent>
            <Badge 
              variant={
                billingStatus === 'ahead' ? 'default' : 
                billingStatus === 'behind' ? 'destructive' : 
                'secondary'
              }
              className={
                billingStatus === 'ahead' ? 'bg-green-100 text-green-800' :
                billingStatus === 'behind' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }
            >
              {billingStatus === 'ahead' ? 'Billing Ahead' :
               billingStatus === 'behind' ? 'Billing Behind' :
               'On Track'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {billingData.paidInvoicesCount}/{billingData.invoicesCount} invoices paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress vs Billing Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Progress vs Billing Analysis</CardTitle>
          <CardDescription>
            Compare project completion percentage with billing percentage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billingData.totalBudget === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Budget Data</h3>
              <p className="text-muted-foreground">Set a project budget to analyze billing progress</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis 
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(1)}%`]}
                    />
                    <Bar 
                      dataKey="completion" 
                      fill="#3b82f6" 
                      name="Project Completion"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="billing" 
                      fill="#10b981" 
                      name="Billing Progress"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Analysis Text */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Analysis</h4>
                {billingStatus === 'ahead' && (
                  <p className="text-sm text-muted-foreground">
                    Billing is ahead of project completion. Consider if this aligns with your payment schedule and project milestones.
                  </p>
                )}
                {billingStatus === 'behind' && (
                  <p className="text-sm text-muted-foreground">
                    Billing is behind project completion. You may want to issue invoices for completed work.
                  </p>
                )}
                {billingStatus === 'ontrack' && (
                  <p className="text-sm text-muted-foreground">
                    Billing is well-aligned with project completion. Your invoicing is on track.
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
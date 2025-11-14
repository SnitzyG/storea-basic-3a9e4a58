import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, DollarSign, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface FinancialDashboardCardProps {
  stats: {
    totalBudget: number;
    totalSpent: number;
    remaining: number;
    burnRate: number;
    utilizationPercent: number;
    pendingInvoices: any[];
  } | null;
}

export const FinancialDashboardCard = ({ stats }: FinancialDashboardCardProps) => {
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  const getUtilizationColor = () => {
    if (stats.utilizationPercent > 90) return 'bg-red-600';
    if (stats.utilizationPercent > 75) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Dashboard
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Total Budget</div>
            <div className="text-xl font-bold">{formatCurrency(stats.totalBudget)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Total Spent</div>
            <div className="text-xl font-bold">{formatCurrency(stats.totalSpent)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Remaining</div>
            <div className="text-xl font-bold text-green-600">{formatCurrency(stats.remaining)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Burn Rate</div>
            <div className="text-xl font-bold flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {formatCurrency(stats.burnRate)}/mo
            </div>
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Budget Utilization</span>
            <span className="font-semibold">{stats.utilizationPercent}%</span>
          </div>
          <div className="relative">
            <Progress value={stats.utilizationPercent} className="h-3" />
            <div className={`absolute inset-0 rounded-full ${getUtilizationColor()} transition-all`}
                 style={{ width: `${Math.min(stats.utilizationPercent, 100)}%` }} />
          </div>
        </div>

        {/* Pending Invoices */}
        {stats.pendingInvoices.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Pending Invoices</h4>
            <div className="space-y-1">
              {stats.pendingInvoices.slice(0, 3).map(invoice => (
                <div key={invoice.id} className="flex items-center justify-between p-2 rounded border border-border">
                  <div>
                    <div className="text-sm font-medium">{invoice.number}</div>
                    <div className="text-xs text-muted-foreground">{invoice.vendor}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatCurrency(invoice.amount)}</div>
                    <div className="text-xs text-muted-foreground">Due {invoice.dueDate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button 
          variant="outline" 
          className="w-full" 
          onClick={() => navigate('/financials')}
        >
          View Financial Details
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

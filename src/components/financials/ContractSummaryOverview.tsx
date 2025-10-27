import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, TrendingUp, TrendingDown, FileText } from 'lucide-react';

interface ContractSummary {
  baseTotal: number;
  margin: number;
  marginPercent: number;
  provisionalSums: number;
  primeCostSums: number;
  variations: number;
  total: number;
  gst: number;
  claimed: number;
  balance: number;
  pct: number;
}

export function ContractSummaryOverview({ projectId }: { projectId: string }) {
  const [summary, setSummary] = useState<ContractSummary>({
    baseTotal: 0,
    margin: 0,
    marginPercent: 10,
    provisionalSums: 0,
    primeCostSums: 0,
    variations: 0,
    total: 0,
    gst: 0,
    claimed: 0,
    balance: 0,
    pct: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, [projectId]);

  const fetchSummary = async () => {
    try {
      // Get line item budgets total
      const { data: items } = await supabase
        .from('line_item_budgets')
        .select('contract_budget')
        .eq('project_id', projectId);
      const baseTotal = items?.reduce((sum, i) => sum + i.contract_budget, 0) || 0;

      // Get budget settings
      const { data: budget } = await supabase
        .from('project_budgets')
        .select('project_management_margin_percent, provisional_sums_total, prime_cost_sums_total')
        .eq('project_id', projectId)
        .single();

      const marginPercent = budget?.project_management_margin_percent || 10;
      const margin = baseTotal * (marginPercent / 100);
      const provisionalSums = budget?.provisional_sums_total || 0;
      const primeCostSums = budget?.prime_cost_sums_total || 0;

      // Get approved variations total
      const { data: vars } = await supabase
        .from('change_orders')
        .select('financial_impact')
        .eq('project_id', projectId)
        .eq('status', 'approved');
      const variations = vars?.reduce((sum, v) => sum + v.financial_impact, 0) || 0;

      // Calculate contract total
      const total = baseTotal + margin + provisionalSums + primeCostSums + variations;
      const gst = total * 0.1;

      // Get paid claims total
      const { data: claims } = await supabase
        .from('progress_claims')
        .select('total_amount_incl_gst')
        .eq('project_id', projectId)
        .in('status', ['approved', 'paid']);
      const claimed = claims?.reduce((sum, c) => sum + c.total_amount_incl_gst, 0) || 0;

      setSummary({
        baseTotal,
        margin,
        marginPercent,
        provisionalSums,
        primeCostSums,
        variations,
        total,
        gst,
        claimed,
        balance: total + gst - claimed,
        pct: ((claimed / (total + gst)) * 100) || 0,
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Contract Total (inc GST)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.total + summary.gst)}</div>
            <p className="text-xs text-muted-foreground">Excl GST: {formatCurrency(summary.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Claimed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.claimed)}</div>
            <Progress value={summary.pct} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">{summary.pct.toFixed(1)}% of contract</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {summary.balance >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              Remaining Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contract Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between p-3 bg-muted rounded">
            <span className="text-sm font-medium">Base Contract (Line Items)</span>
            <span className="font-semibold">{formatCurrency(summary.baseTotal)}</span>
          </div>

          {summary.margin > 0 && (
            <div className="flex justify-between p-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-950">
              <span className="text-sm">+ Project Management Overhead ({summary.marginPercent}%)</span>
              <span className="text-green-600 dark:text-green-400 font-semibold">
                +{formatCurrency(summary.margin)}
              </span>
            </div>
          )}

          {summary.provisionalSums > 0 && (
            <div className="flex justify-between p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950">
              <span className="text-sm">+ Provisional Sums</span>
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                +{formatCurrency(summary.provisionalSums)}
              </span>
            </div>
          )}

          {summary.primeCostSums > 0 && (
            <div className="flex justify-between p-3 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950">
              <span className="text-sm">+ Prime Cost Sums</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold">
                +{formatCurrency(summary.primeCostSums)}
              </span>
            </div>
          )}

          {summary.variations !== 0 && (
            <div className={`flex justify-between p-3 border-l-4 ${summary.variations >= 0 ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-red-500 bg-red-50 dark:bg-red-950'}`}>
              <span className="text-sm">+ Approved Variations</span>
              <span className={`font-semibold ${summary.variations >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {summary.variations >= 0 ? '+' : ''}{formatCurrency(summary.variations)}
              </span>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between p-3 bg-primary/10 rounded">
            <span className="font-semibold">Contract Total (excl GST)</span>
            <span className="font-bold">{formatCurrency(summary.total)}</span>
          </div>

          <div className="flex justify-between p-3">
            <span className="text-sm">GST (10%)</span>
            <span className="font-semibold">{formatCurrency(summary.gst)}</span>
          </div>

          <div className="flex justify-between p-3 bg-primary/10 rounded font-bold text-lg border-2 border-primary">
            <span>CONTRACT TOTAL (inc GST)</span>
            <span className="text-primary">{formatCurrency(summary.total + summary.gst)}</span>
          </div>

          {summary.claimed > 0 && (
            <>
              <div className="border-t pt-3 mt-4"></div>
              <div className="flex justify-between p-3 bg-muted/50 rounded">
                <span className="text-sm">Less: Claims Paid/Approved</span>
                <span className="font-semibold text-red-600">-{formatCurrency(summary.claimed)}</span>
              </div>
              <div className="flex justify-between p-3 bg-primary/20 rounded font-bold">
                <span>BALANCE REMAINING</span>
                <span className={summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(summary.balance)}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
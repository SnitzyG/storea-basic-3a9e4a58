import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format, startOfMonth, endOfMonth } from 'date-fns';

interface CashflowForecastProps {
  projectId: string;
  userRole: string;
}

interface CashflowItem {
  id: string;
  item_type: string;
  amount: number;
  forecast_date: string;
  description: string;
  status: string;
}

export function CashflowForecast({ projectId, userRole }: CashflowForecastProps) {
  const [cashflowItems, setCashflowItems] = useState<CashflowItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCashflowData();
  }, [projectId]);

  const fetchCashflowData = async () => {
    try {
      const { data } = await supabase
        .from('cashflow_items')
        .select('*')
        .eq('project_id', projectId)
        .order('forecast_date');

      setCashflowItems(data || []);
    } catch (error) {
      console.error('Error fetching cashflow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateChartData = () => {
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = addDays(endOfMonth(addDays(today, 180)), 0); // 6 months ahead
    
    const chartData = [];
    let runningBalance = 0;
    
    for (let date = startDate; date <= endDate; date = addDays(date, 7)) { // Weekly intervals
      const weekStart = format(date, 'yyyy-MM-dd');
      const weekEnd = format(addDays(date, 6), 'yyyy-MM-dd');
      
      const weeklyIncoming = cashflowItems
        .filter(item => 
          item.item_type === 'incoming' && 
          item.forecast_date >= weekStart && 
          item.forecast_date <= weekEnd
        )
        .reduce((sum, item) => sum + item.amount, 0);
      
      const weeklyOutgoing = cashflowItems
        .filter(item => 
          item.item_type === 'outgoing' && 
          item.forecast_date >= weekStart && 
          item.forecast_date <= weekEnd
        )
        .reduce((sum, item) => sum + item.amount, 0);
      
      runningBalance += weeklyIncoming - weeklyOutgoing;
      
      chartData.push({
        date: format(date, 'MMM dd'),
        incoming: weeklyIncoming,
        outgoing: weeklyOutgoing,
        balance: runningBalance
      });
    }
    
    return chartData;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const chartData = generateChartData();
  const totalIncoming = cashflowItems
    .filter(item => item.item_type === 'incoming')
    .reduce((sum, item) => sum + item.amount, 0);
  const totalOutgoing = cashflowItems
    .filter(item => item.item_type === 'outgoing')
    .reduce((sum, item) => sum + item.amount, 0);
  const netCashflow = totalIncoming - totalOutgoing;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Incoming</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncoming)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expected Outgoing</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOutgoing)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Cashflow</CardTitle>
            {netCashflow >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netCashflow)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cashflow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>6-Month Cashflow Forecast</CardTitle>
          <CardDescription>Expected incoming vs outgoing payments and running balance</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Forecast Data</h3>
              <p className="text-muted-foreground">Add invoices and payments to generate cashflow forecast</p>
            </div>
          ) : (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(Number(value))}
                    labelFormatter={(label) => `Week of ${label}`}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="incoming"
                    stroke="#22c55e"
                    strokeWidth={2}
                    name="Incoming"
                    dot={{ fill: '#22c55e' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="outgoing"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Outgoing"
                    dot={{ fill: '#ef4444' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Running Balance"
                    dot={{ fill: '#3b82f6' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
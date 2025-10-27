import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';

interface ClaimWithCumulative {
  id: string;
  claim_number: string;
  claim_date: string;
  month_period: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'paid';
  total_amount_incl_gst: number;
  total_works_completed_to_date: number;
  cumulative: number;
}

export function ClaimsHistoryTable({ projectId }: { projectId: string }) {
  const [claims, setClaims] = useState<ClaimWithCumulative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [projectId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_claims')
        .select('*')
        .eq('project_id', projectId)
        .order('claim_date', { ascending: true });

      if (error) throw error;

      // Calculate cumulative totals
      const claimsWithCum: ClaimWithCumulative[] = (data || []).map((claim, idx) => ({
        ...(claim as any),
        cumulative: (data || [])
          .slice(0, idx + 1)
          .reduce((sum, c) => sum + c.total_amount_incl_gst, 0),
      }));

      setClaims(claimsWithCum);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: 'secondary',
      submitted: 'outline',
      approved: 'default',
      paid: 'default',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
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

  if (claims.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Claims History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No claims history yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Claims History - Cumulative Tracking</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">This Claim</TableHead>
              <TableHead className="text-right">Works To Date</TableHead>
              <TableHead className="text-right">Cumulative Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {claims.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell className="font-medium">{claim.claim_number}</TableCell>
                <TableCell>{claim.month_period || '-'}</TableCell>
                <TableCell>{format(new Date(claim.claim_date), 'dd/MM/yyyy')}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(claim.total_amount_incl_gst)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(claim.total_works_completed_to_date)}
                </TableCell>
                <TableCell className="text-right font-bold text-primary">
                  {formatCurrency(claim.cumulative)}
                </TableCell>
                <TableCell>{getStatusBadge(claim.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
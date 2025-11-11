import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

interface ProgressClaim {
  id: string;
  claim_number: string;
  claim_date: string;
  month_period: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'paid';
  total_works_completed_to_date: number;
  total_variations_included: number;
  total_amount_excl_gst: number;
  gst_applicable: number;
  total_amount_incl_gst: number;
  created_at: string;
}

interface ProgressClaimsSectionProps {
  projectId: string;
  userRole: string;
  userId?: string | null;
}

export function ProgressClaimsSection({ projectId, userRole, userId }: ProgressClaimsSectionProps) {
  const [claims, setClaims] = useState<ProgressClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [claimDate, setClaimDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [monthPeriod, setMonthPeriod] = useState(format(new Date(), 'MMMM yyyy'));

  const canManageClaims = ['architect', 'contractor', 'builder'].includes(userRole);

  const fetchClaims = async () => {
    try {
      const { data, error } = await supabase
        .from('progress_claims')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClaims((data || []) as ProgressClaim[]);
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast({
        title: "Error",
        description: "Failed to fetch progress claims",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClaim = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const claimNumber = `Claim ${claims.length + 1}`;

      const { error } = await supabase
        .from('progress_claims')
        .insert({
          project_id: projectId,
          claim_number: claimNumber,
          claim_date: claimDate,
          month_period: monthPeriod,
          status: 'draft',
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Progress claim created successfully",
      });

      setCreateDialogOpen(false);
      fetchClaims();
    } catch (error) {
      console.error('Error creating claim:', error);
      toast({
        title: "Error",
        description: "Failed to create progress claim",
        variant: "destructive",
      });
    }
  };

  useState(() => {
    fetchClaims();
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: 'secondary',
      submitted: 'default',
      approved: 'default',
      paid: 'default',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Progress Claims</CardTitle>
            <CardDescription>Track and manage construction progress claims</CardDescription>
          </div>
          {canManageClaims && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Claim
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Progress Claim</DialogTitle>
                  <DialogDescription>
                    Create a new progress claim for this project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="claim-date">Claim Date</Label>
                    <Input
                      id="claim-date"
                      type="date"
                      value={claimDate}
                      onChange={(e) => setClaimDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="month-period">Month Period</Label>
                    <Input
                      id="month-period"
                      value={monthPeriod}
                      onChange={(e) => setMonthPeriod(e.target.value)}
                      placeholder="e.g., September 2025"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateClaim}>Create Claim</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {claims.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No progress claims yet</p>
            {canManageClaims && <p className="text-sm">Create your first claim to get started</p>}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Claim #</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Works Completed</TableHead>
                <TableHead>Variations</TableHead>
                <TableHead>Total (excl GST)</TableHead>
                <TableHead>GST</TableHead>
                <TableHead>Total (incl GST)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {claims.map((claim) => (
                <TableRow key={claim.id}>
                  <TableCell className="font-medium">{claim.claim_number}</TableCell>
                  <TableCell>{claim.month_period || '-'}</TableCell>
                  <TableCell>{format(new Date(claim.claim_date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{formatCurrency(claim.total_works_completed_to_date)}</TableCell>
                  <TableCell>{formatCurrency(claim.total_variations_included)}</TableCell>
                  <TableCell>{formatCurrency(claim.total_amount_excl_gst)}</TableCell>
                  <TableCell>{formatCurrency(claim.gst_applicable)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(claim.total_amount_incl_gst)}</TableCell>
                  <TableCell>{getStatusBadge(claim.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
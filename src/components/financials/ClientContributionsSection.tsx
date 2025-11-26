import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Users, Check, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ClientContributionsSectionProps {
  projectId: string;
  userRole: string;
}

interface ClientContribution {
  id: string;
  contribution_type: string;
  amount: number;
  expected_date?: string;
  received_date?: string;
  payment_method?: string;
  reference_number?: string;
  description?: string;
  status: string;
  created_at: string;
}

export function ClientContributionsSection({ projectId, userRole }: ClientContributionsSectionProps) {
  const [contributions, setContributions] = useState<ClientContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newContribution, setNewContribution] = useState({
    contribution_type: 'deposit',
    amount: 0,
    expected_date: '',
    description: ''
  });

  const canManage = ['architect', 'contractor'].includes(userRole);

  useEffect(() => {
    fetchContributions();
  }, [projectId]);

  const fetchContributions = async () => {
    try {
      const { data } = await supabase
        .from('client_contributions')
        .select('*')
        .eq('project_id', projectId)
        .order('expected_date', { ascending: true });

      setContributions(data || []);
    } catch (error) {
      console.error('Error fetching client contributions:', error);
      toast({
        title: "Error",
        description: "Failed to load client contributions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContribution = async () => {
    if (newContribution.amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('client_contributions')
        .insert({
          project_id: projectId,
          ...newContribution,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      setContributions([...contributions, data]);
      setNewContribution({
        contribution_type: 'deposit',
        amount: 0,
        expected_date: '',
        description: ''
      });
      setAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Contribution added successfully"
      });
    } catch (error) {
      console.error('Error adding contribution:', error);
      toast({
        title: "Error",
        description: "Failed to add contribution",
        variant: "destructive"
      });
    }
  };

  const handleMarkReceived = async (contributionId: string) => {
    try {
      const { error } = await supabase
        .from('client_contributions')
        .update({
          status: 'received',
          received_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', contributionId);

      if (error) throw error;

      setContributions(contributions.map(contrib => 
        contrib.id === contributionId 
          ? { ...contrib, status: 'received', received_date: new Date().toISOString().split('T')[0] }
          : contrib
      ));

      toast({
        title: "Success",
        description: "Payment marked as received"
      });
    } catch (error) {
      console.error('Error updating contribution:', error);
      toast({
        title: "Error",
        description: "Failed to update contribution",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      received: 'default',
      overdue: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'received': return <Check className="h-4 w-4 text-green-600" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const totalExpected = contributions.reduce((sum, contrib) => sum + contrib.amount, 0);
  const totalReceived = contributions
    .filter(contrib => contrib.status === 'received')
    .reduce((sum, contrib) => sum + contrib.amount, 0);
  const totalPending = totalExpected - totalReceived;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-48 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
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
            <CardTitle className="text-sm font-medium">Total Expected</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpected)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalReceived)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Client Contributions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Client Contributions</CardTitle>
              <CardDescription>Track client deposits and payment schedules</CardDescription>
            </div>
            {canManage && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contribution
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Client Contribution</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="type">Contribution Type</Label>
                      <Select 
                        value={newContribution.contribution_type} 
                        onValueChange={(value) => setNewContribution(prev => ({ ...prev, contribution_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deposit">Deposit</SelectItem>
                          <SelectItem value="progress_payment">Progress Payment</SelectItem>
                          <SelectItem value="final_payment">Final Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="amount">Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={newContribution.amount}
                        onChange={(e) => setNewContribution(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="expected_date">Expected Date</Label>
                      <Input
                        id="expected_date"
                        type="date"
                        value={newContribution.expected_date}
                        onChange={(e) => setNewContribution(prev => ({ ...prev, expected_date: e.target.value }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={newContribution.description}
                        onChange={(e) => setNewContribution(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddContribution}>
                        Add Contribution
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {contributions.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Client Contributions</h3>
              <p className="text-muted-foreground mb-4">Add payment schedules and track client contributions</p>
              {canManage && (
                <Button onClick={() => setAddDialogOpen(true)}>
                  Add First Contribution
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Expected Date</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {contributions.map((contribution) => (
                  <TableRow key={contribution.id}>
                    <TableCell className="capitalize">
                      {contribution.contribution_type.replace('_', ' ')}
                    </TableCell>
                    <TableCell>{contribution.description || '-'}</TableCell>
                    <TableCell>
                      {contribution.expected_date 
                        ? format(new Date(contribution.expected_date), 'MMM dd, yyyy')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {contribution.received_date 
                        ? format(new Date(contribution.received_date), 'MMM dd, yyyy')
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(contribution.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(contribution.status)}
                        {getStatusBadge(contribution.status)}
                      </div>
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        {contribution.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkReceived(contribution.id)}
                          >
                            Mark Received
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
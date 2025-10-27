import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, RefreshCw } from 'lucide-react';

interface Variation {
  id: string;
  order_number: string;
  variation_reference: string | null;
  title: string;
  description: string | null;
  reason: string | null;
  financial_impact: number;
  percentage_complete: number;
  amount_claimed: number;
  balance_remaining: number;
  status: string;
  created_at: string;
}

interface VariationsDetailedSectionProps {
  projectId: string;
  userRole: string;
}

export function VariationsDetailedSection({ projectId, userRole }: VariationsDetailedSectionProps) {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reason: '',
    financial_impact: '',
  });

  const canManage = ['architect', 'contractor', 'builder'].includes(userRole);

  useEffect(() => {
    fetchVariations();
  }, [projectId]);

  const fetchVariations = async () => {
    try {
      const { data, error } = await supabase
        .from('change_orders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVariations((data || []) as Variation[]);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to load variations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.title.trim() || !formData.financial_impact) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const varRef = `VO${String(variations.length + 1).padStart(3, '0')}`;
      const orderNum = `CO-${String(variations.length + 1).padStart(4, '0')}`;

      const impact = parseFloat(formData.financial_impact);

      const { error } = await supabase
        .from('change_orders')
        .insert({
          project_id: projectId,
          order_number: orderNum,
          variation_reference: varRef,
          title: formData.title,
          description: formData.description || null,
          reason: formData.reason || null,
          financial_impact: impact,
          percentage_complete: 0,
          amount_claimed: 0,
          balance_remaining: impact,
          status: 'pending',
          requested_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Variation created successfully",
      });

      setFormData({ title: '', description: '', reason: '', financial_impact: '' });
      setAddDialogOpen(false);
      fetchVariations();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to create variation",
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

  const totalImpact = variations.reduce((sum, v) => sum + v.financial_impact, 0);
  const approvedCount = variations.filter(v => v.status === 'approved').length;
  const totalClaimed = variations.reduce((sum, v) => sum + (v.amount_claimed || 0), 0);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      implemented: 'outline',
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Variations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{variations.length}</div>
            <p className="text-xs text-muted-foreground">{approvedCount} approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Impact</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalImpact)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Claimed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalClaimed)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalImpact - totalClaimed)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Variations / Change Orders</CardTitle>
              <CardDescription>Track approved changes and their financial impact</CardDescription>
            </div>
            {canManage && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Variation
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Variation Order</DialogTitle>
                    <DialogDescription>Add a new variation or change order</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Additional bathroom fixtures"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Detailed description of the variation"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="reason">Reason</Label>
                      <Input
                        id="reason"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="Reason for change"
                      />
                    </div>
                    <div>
                      <Label htmlFor="impact">Financial Impact *</Label>
                      <Input
                        id="impact"
                        type="number"
                        step="0.01"
                        value={formData.financial_impact}
                        onChange={(e) => setFormData({ ...formData, financial_impact: e.target.value })}
                        placeholder="0.00"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Use negative values for cost reductions
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAdd}>Create Variation</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {variations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No variations yet</p>
              {canManage && <p className="text-sm">Create your first variation to track changes</p>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ref</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="text-right">Impact</TableHead>
                  <TableHead className="text-right">Claimed</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>% Complete</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variations.map((variation) => (
                  <TableRow key={variation.id}>
                    <TableCell className="font-medium">
                      {variation.variation_reference || variation.order_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{variation.title}</p>
                        {variation.description && (
                          <p className="text-sm text-muted-foreground">{variation.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right ${variation.financial_impact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variation.financial_impact >= 0 ? '+' : ''}
                      {formatCurrency(variation.financial_impact)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(variation.amount_claimed || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(variation.balance_remaining || variation.financial_impact)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{variation.percentage_complete || 0}%</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(variation.status)}</TableCell>
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
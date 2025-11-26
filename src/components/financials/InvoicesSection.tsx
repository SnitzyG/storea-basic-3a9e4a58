import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, FileText, Download, Check, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface InvoicesSectionProps {
  projectId: string;
  userRole: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  vendor_name: string;
  vendor_email?: string;
  amount: number;
  tax_amount: number;
  invoice_date: string;
  due_date?: string;
  status: string;
  description?: string;
  attachment_path?: string;
  created_at: string;
}

export function InvoicesSection({ projectId, userRole }: InvoicesSectionProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newInvoice, setNewInvoice] = useState({
    invoice_number: '',
    vendor_name: '',
    vendor_email: '',
    amount: 0,
    tax_amount: 0,
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    description: ''
  });

  const canManage = ['architect', 'contractor'].includes(userRole);

  useEffect(() => {
    fetchInvoices();
  }, [projectId]);

  const fetchInvoices = async () => {
    try {
      const { data } = await supabase
        .from('project_invoices')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: "Failed to load invoices",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvoice = async () => {
    if (!newInvoice.invoice_number || !newInvoice.vendor_name || newInvoice.amount <= 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('project_invoices')
        .insert({
          project_id: projectId,
          ...newInvoice,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      setInvoices([data, ...invoices]);
      setNewInvoice({
        invoice_number: '',
        vendor_name: '',
        vendor_email: '',
        amount: 0,
        tax_amount: 0,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        description: ''
      });
      setAddDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Invoice added successfully"
      });
    } catch (error) {
      console.error('Error adding invoice:', error);
      toast({
        title: "Error",
        description: "Failed to add invoice",
        variant: "destructive"
      });
    }
  };

  const handleUpdateStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('project_invoices')
        .update({
          status: newStatus,
          ...(newStatus === 'paid' && { paid_date: new Date().toISOString().split('T')[0] })
        })
        .eq('id', invoiceId);

      if (error) throw error;

      setInvoices(invoices.map(inv => 
        inv.id === invoiceId 
          ? { ...inv, status: newStatus }
          : inv
      ));

      toast({
        title: "Success",
        description: `Invoice ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast({
        title: "Error",
        description: "Failed to update invoice",
        variant: "destructive"
      });
    }
  };

  const filteredInvoices = invoices.filter(invoice => 
    statusFilter === 'all' || invoice.status === statusFilter
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      paid: 'default',
      overdue: 'destructive'
    } as const;

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Check className="h-4 w-4 text-blue-600" />;
      case 'paid': return <Check className="h-4 w-4 text-green-600" />;
      case 'overdue': return <X className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

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
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
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
            <CardTitle>Invoices</CardTitle>
            <CardDescription>Track vendor invoices and payment status</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            {canManage && (
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Invoice
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Invoice</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="invoice_number">Invoice Number *</Label>
                        <Input
                          id="invoice_number"
                          value={newInvoice.invoice_number}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, invoice_number: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="amount">Amount *</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={newInvoice.amount}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="vendor_name">Vendor Name *</Label>
                      <Input
                        id="vendor_name"
                        value={newInvoice.vendor_name}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, vendor_name: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="vendor_email">Vendor Email</Label>
                      <Input
                        id="vendor_email"
                        type="email"
                        value={newInvoice.vendor_email}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, vendor_email: e.target.value }))}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="invoice_date">Invoice Date</Label>
                        <Input
                          id="invoice_date"
                          type="date"
                          value={newInvoice.invoice_date}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, invoice_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="due_date">Due Date</Label>
                        <Input
                          id="due_date"
                          type="date"
                          value={newInvoice.due_date}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, due_date: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tax_amount">Tax Amount</Label>
                      <Input
                        id="tax_amount"
                        type="number"
                        step="0.01"
                        value={newInvoice.tax_amount}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, tax_amount: Number(e.target.value) }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newInvoice.description}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddInvoice}>
                        Add Invoice
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
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Invoices</h3>
            <p className="text-muted-foreground mb-4">Add invoices to track project expenses</p>
            {canManage && (
              <Button onClick={() => setAddDialogOpen(true)}>
                Add First Invoice
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{invoice.vendor_name}</div>
                      {invoice.vendor_email && (
                        <div className="text-sm text-muted-foreground">{invoice.vendor_email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    {invoice.due_date ? format(new Date(invoice.due_date), 'MMM dd, yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div>{formatCurrency(invoice.amount)}</div>
                    {invoice.tax_amount > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Tax: {formatCurrency(invoice.tax_amount)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invoice.status)}
                      {getStatusBadge(invoice.status)}
                    </div>
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {invoice.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(invoice.id, 'approved')}
                          >
                            Approve
                          </Button>
                        )}
                        {invoice.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(invoice.id, 'paid')}
                          >
                            Mark Paid
                          </Button>
                        )}
                        {invoice.attachment_path && (
                          <Button size="sm" variant="ghost">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
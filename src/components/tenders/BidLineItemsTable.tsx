import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface BidLineItemsTableProps {
  bidId: string;
  tenderId: string;
}

export const BidLineItemsTable: React.FC<BidLineItemsTableProps> = ({ bidId, tenderId }) => {
  const [lineItems, setLineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLineItems();
  }, [bidId]);

  const fetchLineItems = async () => {
    try {
      const { data, error } = await supabase
        .from('tender_bid_line_items')
        .select('*')
        .eq('bid_id', bidId)
        .order('line_number', { ascending: true });

      if (error) throw error;
      setLineItems(data || []);
    } catch (error) {
      console.error('Error fetching line items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (lineItems.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <p>No line items available for this bid</p>
      </div>
    );
  }

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price || 0), 0);
  const gst = subtotal * 0.1;
  const total = subtotal + gst;

  // Group line items by category
  const groupedItems = lineItems.reduce((acc, item) => {
    const category = item.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-16">#</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedItems).map(([category, items]: [string, any[]]) => (
              <React.Fragment key={category}>
                {/* Category Header */}
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={6} className="font-semibold text-sm">
                    {category}
                  </TableCell>
                </TableRow>
                
                {/* Line Items */}
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {item.line_number || index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.item_description}</p>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.quantity?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.unit || 'ea'}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${item.unit_price?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      ${((item.quantity || 0) * (item.unit_price || 0)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Category Subtotal */}
                <TableRow className="bg-muted/20 font-semibold">
                  <TableCell colSpan={5} className="text-right">
                    {category} Subtotal:
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${(items as any[]).reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0).toFixed(2)}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}

            {/* Grand Totals */}
            <TableRow className="border-t-2">
              <TableCell colSpan={5} className="text-right font-semibold">
                Subtotal:
              </TableCell>
              <TableCell className="text-right font-mono font-semibold">
                ${subtotal.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={5} className="text-right font-semibold">
                GST (10%):
              </TableCell>
              <TableCell className="text-right font-mono font-semibold">
                ${gst.toFixed(2)}
              </TableCell>
            </TableRow>
            <TableRow className="bg-primary/5">
              <TableCell colSpan={5} className="text-right text-lg font-bold">
                Grand Total (incl. GST):
              </TableCell>
              <TableCell className="text-right text-lg font-mono font-bold text-primary">
                ${total.toFixed(2)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="bg-muted/50 p-3 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Total Items</p>
          <p className="text-xl font-bold">{lineItems.length}</p>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Categories</p>
          <p className="text-xl font-bold">{Object.keys(groupedItems).length}</p>
        </div>
        <div className="bg-muted/50 p-3 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Avg Item Value</p>
          <p className="text-xl font-bold">${lineItems.length > 0 ? (subtotal / lineItems.length).toFixed(0) : '0'}</p>
        </div>
      </div>
    </div>
  );
};

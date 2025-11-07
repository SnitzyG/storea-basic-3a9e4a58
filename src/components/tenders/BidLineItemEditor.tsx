import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Edit, Lock, Loader2 } from 'lucide-react';
import { useTenderBidLineItems } from '@/hooks/useTenderBidLineItems';
import { toast } from 'sonner';

interface BidLineItemEditorProps {
  bidId: string;
  tenderId: string;
  isOwner: boolean;
  isBeforeDeadline: boolean;
  readOnly?: boolean;
}

export const BidLineItemEditor = ({ 
  bidId, 
  tenderId, 
  isOwner, 
  isBeforeDeadline,
  readOnly = false 
}: BidLineItemEditorProps) => {
  const { lineItems, loading, updateLineItem, calculateTotals } = useTenderBidLineItems(bidId);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editedItems, setEditedItems] = useState<Record<string, { unitPrice: number; notes: string }>>({});

  const canEdit = isOwner && isBeforeDeadline && !readOnly;
  const totals = calculateTotals();

  useEffect(() => {
    // Initialize edited items from line items
    const initial: Record<string, { unitPrice: number; notes: string }> = {};
    lineItems.forEach(item => {
      initial[item.id] = {
        unitPrice: item.unit_price,
        notes: item.notes || ''
      };
    });
    setEditedItems(initial);
  }, [lineItems]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = lineItems.map(async (item) => {
        const edited = editedItems[item.id];
        if (edited && (edited.unitPrice !== item.unit_price || edited.notes !== item.notes)) {
          const quantity = item.quantity || 1;
          const total = quantity * edited.unitPrice;
          
          await updateLineItem(item.id, {
            unit_price: edited.unitPrice,
            total,
            notes: edited.notes
          });
        }
      });

      await Promise.all(updates);
      setEditMode(false);
      toast.success('Bid line items updated successfully');
    } catch (error: any) {
      toast.error('Failed to save changes: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    const reset: Record<string, { unitPrice: number; notes: string }> = {};
    lineItems.forEach(item => {
      reset[item.id] = {
        unitPrice: item.unit_price,
        notes: item.notes || ''
      };
    });
    setEditedItems(reset);
    setEditMode(false);
  };

  // Group line items by category
  const groupedItems = lineItems.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, typeof lineItems>);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (lineItems.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-12">
            No line items found for this bid
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bid Line Items</CardTitle>
              <CardDescription>
                {editMode ? 'Edit your bid line items and prices' : 'View detailed breakdown of your bid'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!editMode && canEdit && (
                <Button onClick={() => setEditMode(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Bid
                </Button>
              )}
              {editMode && (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
              {!canEdit && (
                <Badge variant="secondary">
                  <Lock className="h-3 w-3 mr-1" />
                  {readOnly ? 'View Only' : isBeforeDeadline ? 'Read Only' : 'Deadline Passed'}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Line items by category */}
      {Object.entries(groupedItems).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-lg">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">#{item.line_number}</Badge>
                        <h4 className="font-medium">{item.item_description}</h4>
                      </div>
                      {item.specification && (
                        <p className="text-sm text-muted-foreground">{item.specification}</p>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground shrink-0 ml-4">
                      {item.quantity} {item.unit_of_measure}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Unit Price</Label>
                      {editMode ? (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editedItems[item.id]?.unitPrice || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setEditedItems(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], unitPrice: value }
                            }));
                          }}
                        />
                      ) : (
                        <div className="h-10 flex items-center text-lg font-semibold">
                          ${item.unit_price.toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Total</Label>
                      <div className="h-10 flex items-center text-lg font-bold text-primary">
                        ${editMode 
                          ? ((item.quantity || 1) * (editedItems[item.id]?.unitPrice || 0)).toFixed(2)
                          : item.total.toFixed(2)
                        }
                      </div>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      {editMode ? (
                        <Input
                          placeholder="Optional notes..."
                          value={editedItems[item.id]?.notes || ''}
                          onChange={(e) => {
                            setEditedItems(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], notes: e.target.value }
                            }));
                          }}
                        />
                      ) : (
                        <div className="h-10 flex items-center text-sm text-muted-foreground">
                          {item.notes || '-'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Totals summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span className="font-medium">Subtotal:</span>
              <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="font-medium">GST (10%):</span>
              <span className="font-semibold">${totals.gst.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-2xl font-bold text-primary">
              <span>Grand Total:</span>
              <span>${totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

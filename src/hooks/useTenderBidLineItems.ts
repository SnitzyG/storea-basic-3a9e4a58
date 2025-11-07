import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TenderBidLineItem {
  id: string;
  bid_id: string;
  tender_line_item_id: string | null;
  line_number: number;
  item_description: string;
  specification: string | null;
  unit_of_measure: string | null;
  quantity: number | null;
  unit_price: number;
  total: number;
  category: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useTenderBidLineItems = (bidId?: string) => {
  const [lineItems, setLineItems] = useState<TenderBidLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLineItems = async () => {
    if (!bidId) {
      setLineItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tender_bid_line_items')
        .select('*')
        .eq('bid_id', bidId)
        .order('line_number', { ascending: true });

      if (error) throw error;
      setLineItems(data || []);
    } catch (error: any) {
      console.error('Error fetching bid line items:', error);
      toast({
        title: 'Error loading bid line items',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createLineItem = async (item: Omit<TenderBidLineItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tender_bid_line_items')
        .insert([item])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Line item added',
        description: 'Bid line item created successfully'
      });

      await fetchLineItems();
      return data;
    } catch (error: any) {
      console.error('Error creating line item:', error);
      toast({
        title: 'Error creating line item',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateLineItem = async (id: string, updates: Partial<TenderBidLineItem>) => {
    try {
      const { error } = await supabase
        .from('tender_bid_line_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Line item updated',
        description: 'Changes saved successfully'
      });

      await fetchLineItems();
    } catch (error: any) {
      console.error('Error updating line item:', error);
      toast({
        title: 'Error updating line item',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteLineItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tender_bid_line_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Line item deleted',
        description: 'Item removed successfully'
      });

      await fetchLineItems();
    } catch (error: any) {
      console.error('Error deleting line item:', error);
      toast({
        title: 'Error deleting line item',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const bulkCreateLineItems = async (items: Omit<TenderBidLineItem, 'id' | 'created_at' | 'updated_at'>[]) => {
    try {
      const { error } = await supabase
        .from('tender_bid_line_items')
        .insert(items);

      if (error) throw error;

      toast({
        title: 'Line items imported',
        description: `${items.length} items added successfully`
      });

      await fetchLineItems();
    } catch (error: any) {
      console.error('Error bulk creating line items:', error);
      toast({
        title: 'Error importing line items',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const gst = subtotal * 0.10;
    const grandTotal = subtotal + gst;

    return { subtotal, gst, grandTotal };
  };

  useEffect(() => {
    fetchLineItems();
  }, [bidId]);

  return {
    lineItems,
    loading,
    createLineItem,
    updateLineItem,
    deleteLineItem,
    bulkCreateLineItems,
    calculateTotals,
    refetch: fetchLineItems
  };
};

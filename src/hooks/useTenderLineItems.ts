import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

interface TenderLineItem {
  id: string;
  tender_id: string;
  line_number: number;
  item_description: string;
  specification: string | null;
  unit_of_measure: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number;
  category: string;
  created_at: string;
  updated_at: string;
}

export const useTenderLineItems = (tenderId?: string) => {
  const [lineItems, setLineItems] = useState<TenderLineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchLineItems = async () => {
    if (!tenderId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tender_line_items')
        .select('*')
        .eq('tender_id', tenderId)
        .order('line_number', { ascending: true });

      if (error) throw error;
      setLineItems(data || []);
    } catch (error: any) {
      console.error('Error fetching tender line items:', error);
      toast({
        title: 'Error loading line items',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveLineItems = async (tenderId: string, items: Omit<TenderLineItem, 'id' | 'tender_id' | 'created_at' | 'updated_at'>[]) => {
    try {
      // Delete existing line items for this tender
      await supabase
        .from('tender_line_items')
        .delete()
        .eq('tender_id', tenderId);

      // Insert new line items
      const { error } = await supabase
        .from('tender_line_items')
        .insert(
          items.map(item => ({
            tender_id: tenderId,
            ...item
          }))
        );

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${items.length} line items saved to tender`
      });

      // Refresh the list
      await fetchLineItems();
    } catch (error: any) {
      console.error('Error saving tender line items:', error);
      toast({
        title: 'Error saving line items',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const deleteLineItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('tender_line_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: 'Line item deleted'
      });

      await fetchLineItems();
    } catch (error: any) {
      console.error('Error deleting line item:', error);
      toast({
        title: 'Error deleting line item',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchLineItems();
  }, [tenderId]);

  return {
    lineItems,
    loading,
    saveLineItems,
    deleteLineItem,
    refetch: fetchLineItems
  };
};

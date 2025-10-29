import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TenderLineItem {
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
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLineItems = async () => {
    if (!tenderId) {
      setLineItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
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

  useEffect(() => {
    fetchLineItems();
  }, [tenderId]);

  return {
    lineItems,
    loading,
    refetch: fetchLineItems
  };
};

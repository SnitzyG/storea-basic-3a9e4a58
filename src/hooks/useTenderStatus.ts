import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export type TenderStatus = 'draft' | 'published' | 'open' | 'closed' | 'awarded' | 'cancelled';

export const useTenderStatus = () => {
  const { toast } = useToast();

  const updateTenderStatus = async (tenderId: string, newStatus: TenderStatus) => {
    try {
      const updateData: any = { status: newStatus };
      
      // Set published_at timestamp when publishing
      if (newStatus === 'published' || newStatus === 'open') {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tenders')
        .update(updateData)
        .eq('id', tenderId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Tender status changed to ${newStatus}`
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error Updating Status",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const publishTender = async (tenderId: string) => {
    return updateTenderStatus(tenderId, 'open');
  };

  const closeTender = async (tenderId: string) => {
    return updateTenderStatus(tenderId, 'closed');
  };

  const awardTender = async (tenderId: string, winnerId: string) => {
    try {
      // Update tender status
      await updateTenderStatus(tenderId, 'awarded');

      // Update winning bid status
      const { error: bidError } = await supabase
        .from('tender_bids')
        .update({ status: 'accepted' })
        .eq('tender_id', tenderId)
        .eq('bidder_id', winnerId);

      if (bidError) throw bidError;

      // Update losing bids
      const { error: loseError } = await supabase
        .from('tender_bids')
        .update({ status: 'rejected' })
        .eq('tender_id', tenderId)
        .neq('bidder_id', winnerId);

      if (loseError) throw loseError;

      return true;
    } catch (error: any) {
      toast({
        title: "Error Awarding Tender",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const cancelTender = async (tenderId: string) => {
    return updateTenderStatus(tenderId, 'cancelled');
  };

  const getStatusColor = (status: TenderStatus): string => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
      case 'published':
      case 'open':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'closed':
        return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
      case 'awarded':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  const getStatusLabel = (status: TenderStatus): string => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'published':
        return 'Published';
      case 'open':
        return 'Open for Bids';
      case 'closed':
        return 'Closed';
      case 'awarded':
        return 'Awarded';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return {
    updateTenderStatus,
    publishTender,
    closeTender,
    awardTender,
    cancelTender,
    getStatusColor,
    getStatusLabel
  };
};

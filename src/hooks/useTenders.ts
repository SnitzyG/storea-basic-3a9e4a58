import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Tender {
  id: string;
  project_id: string;
  title: string;
  description: string;
  issued_by: string;
  awarded_to?: string;
  budget?: number;
  begin_date?: string;
  deadline: string;
  status: 'draft' | 'open' | 'closed' | 'awarded' | 'cancelled';
  requirements?: any;
  documents?: any[];
  created_at: string;
  updated_at: string;
  issued_by_profile?: {
    name: string;
    role: string;
  };
  awarded_to_profile?: {
    name: string;
    role: string;
  };
  bid_count?: number;
  my_bid?: TenderBid;
}

export interface TenderBid {
  id: string;
  tender_id: string;
  bidder_id: string;
  bid_amount: number;
  proposal_text?: string;
  attachments?: any[];
  status: 'submitted' | 'under_review' | 'accepted' | 'rejected';
  submitted_at: string;
  created_at: string;
  updated_at: string;
  timeline_days?: number;
  bidder_profile?: {
    name: string;
    role: string;
  };
  evaluation?: {
    price_score: number;
    experience_score: number;
    timeline_score: number;
    technical_score: number;
    communication_score: number;
    overall_score: number;
    evaluator_notes: string;
    evaluated_at: string;
    evaluator_id: string;
  };
}

export const useTenders = (projectId?: string) => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTenders = async () => {
    if (!projectId) return;
    
    try {
      // Fetch tenders
      const { data: tendersData, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles for tender issuers and awardees
      const userIds = [...new Set([
        ...tendersData.map(tender => tender.issued_by),
        ...tendersData.map(tender => tender.awarded_to).filter(Boolean)
      ])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, role')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch bid counts and user's bids
      const tenderIds = tendersData.map(t => t.id);
      
      const { data: bids } = await supabase
        .from('tender_bids')
        .select('tender_id, bidder_id, id, bid_amount, proposal_text, status, submitted_at')
        .in('tender_id', tenderIds);

      const bidCountMap = new Map<string, number>();
      const userBidMap = new Map<string, TenderBid>();

      bids?.forEach(bid => {
        bidCountMap.set(bid.tender_id, (bidCountMap.get(bid.tender_id) || 0) + 1);
        if (bid.bidder_id === user?.id) {
          userBidMap.set(bid.tender_id, bid as TenderBid);
        }
      });

      const enrichedTenders = tendersData.map(tender => ({
        ...tender,
        issued_by_profile: profileMap.get(tender.issued_by),
        awarded_to_profile: tender.awarded_to ? profileMap.get(tender.awarded_to) : undefined,
        bid_count: bidCountMap.get(tender.id) || 0,
        my_bid: userBidMap.get(tender.id),
      }));

      setTenders(enrichedTenders as Tender[]);
    } catch (error) {
      console.error('Error fetching tenders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch tenders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTender = async (tenderData: {
    project_id: string;
    title: string;
    description: string;
    budget?: number;
    begin_date?: string;
    deadline: string;
    requirements?: any;
    documents?: any[];
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('tenders')
        .insert({
          ...tenderData,
          issued_by: user.id,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity for tender creation
      await supabase
        .from('activity_log')
        .insert([{
          user_id: user.id,
          project_id: tenderData.project_id,
          entity_type: 'tender',
          entity_id: data.id,
          action: 'created',
          description: `Created new tender: "${tenderData.title}"`,
          metadata: { 
            budget: tenderData.budget,
            deadline: tenderData.deadline,
            status: 'draft'
          }
        }]);

      toast({
        title: "Success",
        description: "Tender created successfully",
      });

      fetchTenders();
      return data;
    } catch (error) {
      console.error('Error creating tender:', error);
      toast({
        title: "Error",
        description: "Failed to create tender",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTender = async (id: string, updates: Partial<Tender>) => {
    try {
      const { data, error } = await supabase
        .from('tenders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tender updated successfully",
      });

      fetchTenders();
      return data;
    } catch (error) {
      console.error('Error updating tender:', error);
      toast({
        title: "Error",
        description: "Failed to update tender",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteTender = async (tenderId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tenders')
        .delete()
        .eq('id', tenderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tender deleted successfully",
      });
      
      fetchTenders();
      return true;
    } catch (error: any) {
      console.error('Error deleting tender:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete tender",
        variant: "destructive",
      });
      return false;
    }
  };

  const publishTender = async (id: string) => {
    return updateTender(id, { status: 'open' });
  };

  const closeTender = async (id: string) => {
    return updateTender(id, { status: 'closed' });
  };

  const awardTender = async (id: string, awardedTo: string) => {
    try {
      // Update tender status and award
      await updateTender(id, { status: 'awarded', awarded_to: awardedTo });
      
      // Update all bids for this tender - mark the winning bid as accepted, others as rejected
      const { error: acceptBidError } = await supabase
        .from('tender_bids')
        .update({ status: 'accepted' })
        .eq('tender_id', id)
        .eq('bidder_id', awardedTo);

      if (acceptBidError) throw acceptBidError;

      const { error: rejectBidsError } = await supabase
        .from('tender_bids')
        .update({ status: 'rejected' })
        .eq('tender_id', id)
        .neq('bidder_id', awardedTo);

      if (rejectBidsError) throw rejectBidsError;

      toast({
        title: "Success",
        description: "Tender awarded successfully",
      });

      return true;
    } catch (error) {
      console.error('Error awarding tender:', error);
      toast({
        title: "Error",
        description: "Failed to award tender",
        variant: "destructive",
      });
      return false;
    }
  };

  const submitBid = async (bidData: {
    tender_id: string;
    bid_amount: number;
    proposal_text?: string;
    attachments?: any[];
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('tender_bids')
        .insert({
          ...bidData,
          bidder_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Get tender project_id for activity logging
      const { data: tender } = await supabase
        .from('tenders')
        .select('project_id, title')
        .eq('id', bidData.tender_id)
        .single();

      if (tender) {
        // Log activity for bid submission
        await supabase
          .from('activity_log')
          .insert([{
            user_id: user.id,
            project_id: tender.project_id,
            entity_type: 'tender',
            entity_id: bidData.tender_id,
            action: 'submitted',
            description: `Submitted bid for tender: "${tender.title}" - $${bidData.bid_amount?.toLocaleString()}`,
            metadata: { 
              bid_amount: bidData.bid_amount,
              tender_id: bidData.tender_id,
              bid_id: data.id
            }
          }]);
      }

      toast({
        title: "Success",
        description: "Bid submitted successfully",
      });

      fetchTenders();
      return data;
    } catch (error) {
      console.error('Error submitting bid:', error);
      toast({
        title: "Error",
        description: "Failed to submit bid",
        variant: "destructive",
      });
      return null;
    }
  };

  const getTenderBids = async (tenderId: string): Promise<TenderBid[]> => {
    try {
      const { data: bidsData, error } = await supabase
        .from('tender_bids')
        .select('*')
        .eq('tender_id', tenderId)
        .order('bid_amount', { ascending: true });

      if (error) throw error;

      // Fetch bidder profiles
      const bidderIds = [...new Set(bidsData.map(bid => bid.bidder_id))];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, role')
        .in('user_id', bidderIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedBids = bidsData.map(bid => ({
        ...bid,
        bidder_profile: profileMap.get(bid.bidder_id),
      }));

      return enrichedBids as TenderBid[];
    } catch (error) {
      console.error('Error fetching tender bids:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchTenders();
  }, [projectId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!projectId) return;

    const tendersChannel = supabase
      .channel('tenders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenders',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchTenders();
        }
      )
      .subscribe();

    const bidsChannel = supabase
      .channel('tender-bids-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tender_bids',
        },
        () => {
          fetchTenders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tendersChannel);
      supabase.removeChannel(bidsChannel);
    };
  }, [projectId]);

  return {
    tenders,
    loading,
    createTender,
    updateTender,
    deleteTender,
    publishTender,
    closeTender,
    awardTender,
    submitBid,
    getTenderBids,
    refetch: fetchTenders,
  };
};
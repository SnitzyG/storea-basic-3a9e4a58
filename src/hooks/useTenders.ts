import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Tender {
  id: string;
  project_id: string;
  tender_id?: string;
  title: string;
  description: string; // Now used as "Message"
  issued_by: string;
  awarded_to?: string;
  estimated_start_date?: string; // Renamed from begin_date
  deadline: string; // Now includes time
  status: 'draft' | 'open' | 'closed' | 'awarded' | 'cancelled';
  requirements?: any;
  documents?: any[];
  tender_specification_path?: string;
  scope_of_works_path?: string;
  construction_items?: any[];
  builder_company_name?: string;
  builder_address?: string;
  builder_phone?: string;
  builder_contact_person?: string;
  builder_email?: string;
  is_ready_for_tender?: boolean;
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
  // Legacy fields for backwards compatibility
  budget?: number;
  begin_date?: string;
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
    console.log('[useTenders] fetchTenders called with projectId:', projectId);
    
    if (!projectId) {
      console.log('[useTenders] No projectId, returning early');
      return;
    }
    
    try {
      let tendersData: any[] = [];
      
      // Fetch tenders issued by the project
      const { data: projectTenders, error: projectError } = await supabase
        .from('tenders')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (projectError) throw projectError;
      tendersData = projectTenders || [];

      // Also fetch tenders the user has approved access to (for builders)
      if (user) {
        console.log('[useTenders] Fetching approved tenders for user:', user.id);
        const { data: approvedAccess } = await supabase
          .from('tender_access')
          .select('tender_id')
          .eq('user_id', user.id)
          .eq('status', 'approved');

        console.log('[useTenders] Approved access records:', approvedAccess);

        if (approvedAccess && approvedAccess.length > 0) {
          const approvedTenderIds = approvedAccess.map(a => a.tender_id);
          console.log('[useTenders] Fetching tenders with IDs:', approvedTenderIds);
          
          const { data: approvedTenders, error: approvedError } = await supabase
            .from('tenders')
            .select('*')
            .in('id', approvedTenderIds)
            .order('created_at', { ascending: false });

          console.log('[useTenders] Approved tenders fetched:', approvedTenders, 'error:', approvedError);

          if (approvedTenders) {
            // Merge approved tenders with project tenders (avoid duplicates)
            const existingIds = new Set(tendersData.map(t => t.id));
            const newTenders = approvedTenders.filter(t => !existingIds.has(t.id));
            console.log('[useTenders] Adding', newTenders.length, 'approved tenders to the list');
            tendersData = [...tendersData, ...newTenders];
          }
        }
      }

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

      console.log('[useTenders] Final enriched tenders count:', enrichedTenders.length);
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
    estimated_start_date?: string;
    deadline: string;
    tender_specification_path?: string;
    scope_of_works_path?: string;
    construction_items?: any[];
    builder_company_name?: string;
    builder_address?: string;
    builder_phone?: string;
    builder_contact_person?: string;
    builder_email?: string;
    is_ready_for_tender?: boolean;
    documents?: any[];
    requirements?: any;
    budget?: number;
  }) => {
    if (!user) return null;

    try {
      // Only insert known columns to avoid PostgREST schema errors
      const payload = {
        project_id: tenderData.project_id,
        title: tenderData.title,
        description: tenderData.description,
        estimated_start_date: tenderData.estimated_start_date,
        deadline: tenderData.deadline,
        tender_specification_path: tenderData.tender_specification_path,
        scope_of_works_path: tenderData.scope_of_works_path,
        construction_items: tenderData.construction_items,
        builder_company_name: tenderData.builder_company_name,
        builder_address: tenderData.builder_address,
        builder_phone: tenderData.builder_phone,
        builder_contact_person: tenderData.builder_contact_person,
        builder_email: tenderData.builder_email,
        is_ready_for_tender: tenderData.is_ready_for_tender,
        documents: tenderData.documents,
        requirements: tenderData.requirements,
        budget: tenderData.budget,
        issued_by: user.id,
        status: 'draft' as const,
      } as const;

      const { data, error } = await supabase
        .from('tenders')
        .insert(payload as any)
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
            deadline: tenderData.deadline,
            status: 'draft',
            is_ready_for_tender: tenderData.is_ready_for_tender
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
      // Use the cascade delete function to properly delete tender and all related data
      const { data, error } = await supabase.rpc('delete_tender_cascade', {
        tender_id_param: tenderId
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tender and all related data deleted successfully",
      });
      
      fetchTenders();
      return true;
    } catch (error: any) {
      console.error('Error deleting tender:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete tender. Please try again.",
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
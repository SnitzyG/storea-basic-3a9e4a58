import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface TenderPackage {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  total_budget?: number;
  package_type: 'general' | 'design' | 'construction' | 'consulting';
  status: 'active' | 'inactive' | 'completed';
}

export interface EnhancedTender {
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
  tender_package_id?: string;
  tender_type: string;
  compliance_requirements: any;
  evaluation_criteria: {
    price_weight: number;
    experience_weight: number;
    timeline_weight: number;
    technical_weight: number;
    communication_weight: number;
  };
  workflow_stage: string;
  auto_close_enabled: boolean;
  issued_by_profile?: {
    name: string;
    role: string;
  };
  awarded_to_profile?: {
    name: string;
    role: string;
  };
  bid_count?: number;
  my_bid?: EnhancedTenderBid;
  package?: TenderPackage;
  discussions_count?: number;
  amendments_count?: number;
}

export interface EnhancedTenderBid {
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
  estimated_duration_days?: number;
  price_score: number;
  experience_score: number;
  timeline_score: number;
  technical_score: number;
  communication_score: number;
  overall_score: number;
  evaluator_notes?: string;
  evaluated_at?: string;
  evaluator_id?: string;
  compliance_checked: boolean;
  compliance_issues: any[];
  bidder_profile?: {
    name: string;
    role: string;
  };
}

export interface TenderDiscussion {
  id: string;
  tender_id: string;
  user_id: string;
  message: string;
  message_type: 'question' | 'clarification' | 'announcement';
  parent_id?: string;
  is_official: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: {
    name: string;
    role: string;
  };
  replies?: TenderDiscussion[];
}

export interface TenderAmendment {
  id: string;
  tender_id: string;
  amendment_number: number;
  title: string;
  description: string;
  changes_made: any;
  issued_by: string;
  issued_at: string;
  notification_sent: boolean;
  issued_by_profile?: {
    name: string;
    role: string;
  };
}

export interface ContractorPrequalification {
  id: string;
  project_id: string;
  contractor_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  experience_years?: number;
  certifications: any[];
  previous_projects: any[];
  financial_capacity?: number;
  insurance_details: any;
  contractor_references: any[];
  documents: any[];
  review_notes?: string;
  contractor_profile?: {
    name: string;
    role: string;
  };
}

export const useEnhancedTenders = (projectId?: string) => {
  const [tenders, setTenders] = useState<EnhancedTender[]>([]);
  const [packages, setPackages] = useState<TenderPackage[]>([]);
  const [prequalifications, setPrequalifications] = useState<ContractorPrequalification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTenders = async () => {
    if (!projectId) return;
    
    try {
      // Fetch enhanced tenders with all new fields
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

      // Fetch tender packages
      const { data: packagesData } = await supabase
        .from('tender_packages')
        .select('*')
        .eq('project_id', projectId);

      const packageMap = new Map(packagesData?.map(p => [p.id, p]) || []);

      // Fetch bid counts and user's bids with enhanced data
      const tenderIds = tendersData.map(t => t.id);
      
      const { data: bids } = await supabase
        .from('tender_bids')
        .select('*')
        .in('tender_id', tenderIds);

      const bidCountMap = new Map<string, number>();
      const userBidMap = new Map<string, EnhancedTenderBid>();

      bids?.forEach(bid => {
        bidCountMap.set(bid.tender_id, (bidCountMap.get(bid.tender_id) || 0) + 1);
        if (bid.bidder_id === user?.id) {
          userBidMap.set(bid.tender_id, bid as EnhancedTenderBid);
        }
      });

      // Fetch discussions count
      const { data: discussionsData } = await supabase
        .from('tender_discussions')
        .select('tender_id')
        .in('tender_id', tenderIds);

      const discussionsCountMap = new Map<string, number>();
      discussionsData?.forEach(discussion => {
        discussionsCountMap.set(discussion.tender_id, 
          (discussionsCountMap.get(discussion.tender_id) || 0) + 1);
      });

      // Fetch amendments count
      const { data: amendmentsData } = await supabase
        .from('tender_amendments')
        .select('tender_id')
        .in('tender_id', tenderIds);

      const amendmentsCountMap = new Map<string, number>();
      amendmentsData?.forEach(amendment => {
        amendmentsCountMap.set(amendment.tender_id, 
          (amendmentsCountMap.get(amendment.tender_id) || 0) + 1);
      });

      const enrichedTenders = tendersData.map(tender => ({
        ...tender,
        issued_by_profile: profileMap.get(tender.issued_by),
        awarded_to_profile: tender.awarded_to ? profileMap.get(tender.awarded_to) : undefined,
        bid_count: bidCountMap.get(tender.id) || 0,
        my_bid: userBidMap.get(tender.id),
        package: tender.tender_package_id ? packageMap.get(tender.tender_package_id) : undefined,
        discussions_count: discussionsCountMap.get(tender.id) || 0,
        amendments_count: amendmentsCountMap.get(tender.id) || 0,
      }));

      setTenders(enrichedTenders as any);
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

  const fetchPackages = async () => {
    if (!projectId) return;
    
    try {
      const { data, error } = await supabase
        .from('tender_packages')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPackages(data as any || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchPrequalifications = async () => {
    if (!projectId) return;
    
    try {
      const { data: prequalData, error } = await supabase
        .from('contractor_prequalifications')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;

      // Fetch contractor profiles
      const contractorIds = prequalData?.map(p => p.contractor_id) || [];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, role')
        .in('user_id', contractorIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedPrequalifications = (prequalData || []).map(preq => ({
        ...preq,
        contractor_profile: profileMap.get(preq.contractor_id),
      }));

      setPrequalifications(enrichedPrequalifications as ContractorPrequalification[]);
    } catch (error) {
      console.error('Error fetching prequalifications:', error);
    }
  };

  const createTenderPackage = async (packageData: {
    name: string;
    description?: string;
    total_budget?: number;
    package_type: string;
  }) => {
    if (!user || !projectId) return null;

    try {
      const { data, error } = await supabase
        .from('tender_packages')
        .insert({
          ...packageData,
          project_id: projectId,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Tender package created successfully",
      });

      fetchPackages();
      return data;
    } catch (error) {
      console.error('Error creating package:', error);
      toast({
        title: "Error",
        description: "Failed to create tender package",
        variant: "destructive",
      });
      return null;
    }
  };

  const createTenderDiscussion = async (discussionData: {
    tender_id: string;
    message: string;
    message_type: 'question' | 'clarification' | 'announcement';
    parent_id?: string;
    is_official?: boolean;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('tender_discussions')
        .insert({
          ...discussionData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Discussion posted successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating discussion:', error);
      toast({
        title: "Error",
        description: "Failed to post discussion",
        variant: "destructive",
      });
      return null;
    }
  };

  const createTenderAmendment = async (amendmentData: {
    tender_id: string;
    title: string;
    description: string;
    changes_made: any;
  }) => {
    if (!user) return null;

    try {
      // Get next amendment number for this tender
      const { data: existingAmendments } = await supabase
        .from('tender_amendments')
        .select('amendment_number')
        .eq('tender_id', amendmentData.tender_id)
        .order('amendment_number', { ascending: false })
        .limit(1);

      const nextAmendmentNumber = existingAmendments && existingAmendments.length > 0 
        ? existingAmendments[0].amendment_number + 1 
        : 1;

      const { data, error } = await supabase
        .from('tender_amendments')
        .insert({
          ...amendmentData,
          amendment_number: nextAmendmentNumber,
          issued_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Amendment created successfully",
      });

      fetchTenders();
      return data;
    } catch (error) {
      console.error('Error creating amendment:', error);
      toast({
        title: "Error",
        description: "Failed to create amendment",
        variant: "destructive",
      });
      return null;
    }
  };

  const evaluateBid = async (bidId: string, evaluation: {
    price_score: number;
    experience_score: number;
    timeline_score: number;
    technical_score: number;
    communication_score: number;
    evaluator_notes?: string;
  }) => {
    if (!user) return null;

    try {
      // Calculate overall score based on weights
      const tender = tenders.find(t => t.my_bid?.id === bidId);
      const criteria = tender?.evaluation_criteria || {
        price_weight: 40,
        experience_weight: 20,
        timeline_weight: 20,
        technical_weight: 15,
        communication_weight: 5,
      };

      const overall_score = (
        (evaluation.price_score * criteria.price_weight / 100) +
        (evaluation.experience_score * criteria.experience_weight / 100) +
        (evaluation.timeline_score * criteria.timeline_weight / 100) +
        (evaluation.technical_score * criteria.technical_weight / 100) +
        (evaluation.communication_score * criteria.communication_weight / 100)
      );

      const { data, error } = await supabase
        .from('tender_bids')
        .update({
          ...evaluation,
          overall_score,
          evaluator_id: user.id,
          evaluated_at: new Date().toISOString(),
        })
        .eq('id', bidId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bid evaluation saved successfully",
      });

      fetchTenders();
      return data;
    } catch (error) {
      console.error('Error evaluating bid:', error);
      toast({
        title: "Error",
        description: "Failed to evaluate bid",
        variant: "destructive",
      });
      return null;
    }
  };

  const checkComplianceAutomatically = async (bidId: string) => {
    if (!user) return null;

    try {
      // Basic compliance check logic - can be enhanced
      const { data: bid, error } = await supabase
        .from('tender_bids')
        .select('*, tenders(*)')
        .eq('id', bidId)
        .single();

      if (error) throw error;

      const compliance_issues: string[] = [];
      
      // Check if bid amount is within budget (assuming tenders is properly joined)
      const tender = bid.tenders;
      if (tender && typeof tender === 'object' && !Array.isArray(tender) && 'budget' in tender) {
        const tenderBudget = (tender as any).budget;
        if (tenderBudget && bid.bid_amount > tenderBudget * 1.1) {
          compliance_issues.push('Bid amount exceeds budget by more than 10%');
        }
      }

      // Check if estimated duration is reasonable
      if (bid.estimated_duration_days && bid.estimated_duration_days > 365) {
        compliance_issues.push('Estimated duration exceeds 1 year');
      }

      const { data: updateResult, error: updateError } = await supabase
        .from('tender_bids')
        .update({
          compliance_checked: true,
          compliance_issues,
        })
        .eq('id', bidId)
        .select()
        .single();

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: `Compliance check completed. ${compliance_issues.length} issues found.`,
      });

      return updateResult;
    } catch (error) {
      console.error('Error checking compliance:', error);
      toast({
        title: "Error",
        description: "Failed to check compliance",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchTenders();
      fetchPackages();
      fetchPrequalifications();
    }
  }, [projectId]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!projectId) return;

    const tendersChannel = supabase
      .channel('enhanced-tenders-changes')
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tender_discussions',
        },
        () => {
          fetchTenders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tender_amendments',
        },
        () => {
          fetchTenders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tendersChannel);
    };
  }, [projectId]);

  return {
    tenders,
    packages,
    prequalifications,
    loading,
    createTenderPackage,
    createTenderDiscussion,
    createTenderAmendment,
    evaluateBid,
    checkComplianceAutomatically,
    refetch: fetchTenders,
  };
};
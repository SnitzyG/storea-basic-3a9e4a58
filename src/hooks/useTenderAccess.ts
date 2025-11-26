import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface TenderAccessRequest {
  id: string;
  tender_id: string;
  user_id: string;
  requested_at: string;
  approved_at?: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  requester_name: string;
  requester_email: string;
  company?: string;
  role?: string;
}

export const useTenderAccess = (projectId?: string) => {
  const { user, profile } = useAuth();
  const [accessRequests, setAccessRequests] = useState<TenderAccessRequest[]>([]);
  const [myRequests, setMyRequests] = useState<TenderAccessRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAccessRequests = async () => {
    if (!user || !projectId) return;

    try {
      // Fetch requests for tenders I issued
      const { data: tenderData } = await supabase
        .from('tenders')
        .select('id')
        .eq('project_id', projectId)
        .eq('issued_by', user.id);

      if (!tenderData || tenderData.length === 0) return;

      const tenderIds = tenderData.map(t => t.id);

      const { data, error } = await supabase
        .from('tender_access')
        .select('*')
        .in('tender_id', tenderIds)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setAccessRequests((data || []) as TenderAccessRequest[]);
    } catch (error: any) {
      console.error('Error fetching access requests:', error);
    }
  };

  const fetchMyRequests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tender_access')
        .select('*')
        .eq('user_id', user.id)
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setMyRequests((data || []) as TenderAccessRequest[]);
    } catch (error: any) {
      console.error('Error fetching my requests:', error);
    }
  };

  useEffect(() => {
    fetchAccessRequests();
    fetchMyRequests();
  }, [user, projectId]);

  const requestTenderAccess = async (tenderId: string, tenderIdInput: string, message?: string) => {
    if (!user || !profile) {
      toast.error('You must be logged in to request access');
      return { success: false };
    }

    setLoading(true);
    try {
      // First verify the tender exists and get the tender_id (UUID)
      const { data: tenderData, error: tenderError } = await supabase
        .from('tenders')
        .select('id, title, tender_id')
        .eq('tender_id', tenderIdInput.toUpperCase())
        .maybeSingle();

      if (tenderError || !tenderData) {
        toast.error('Invalid Tender ID. Please check and try again.');
        return { success: false };
      }

      const { error } = await supabase
        .from('tender_access')
        .insert({
          tender_id: tenderData.id,
          user_id: user.id,
          requester_name: profile.name || user.email || 'Unknown',
          requester_email: user.email || '',
          company: profile.company_id ? 'Company' : undefined,
          role: profile.role || undefined,
          message: message || undefined,
          status: 'pending'
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already requested access to this tender');
        } else {
          throw error;
        }
        return { success: false };
      }

      toast.success('Access request submitted successfully');
      await fetchMyRequests();
      return { success: true, tenderTitle: tenderData.title };
    } catch (error: any) {
      console.error('Error requesting tender access:', error);
      toast.error('Failed to submit request');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const approveTenderAccess = async (requestId: string) => {
    if (!user) return { success: false };

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tender_access')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Access request approved');
      await fetchAccessRequests();
      return { success: true };
    } catch (error: any) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const rejectTenderAccess = async (requestId: string) => {
    if (!user) return { success: false };

    setLoading(true);
    try {
      const { error } = await supabase
        .from('tender_access')
        .update({
          status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', requestId);

      if (error) throw error;

      toast.success('Access request rejected');
      await fetchAccessRequests();
      return { success: true };
    } catch (error: any) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const checkTenderAccess = async (tenderId: string) => {
    if (!user) return { hasAccess: false, status: 'no_auth' };

    try {
      const { data, error } = await supabase
        .from('tender_access')
        .select('status')
        .eq('tender_id', tenderId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return { hasAccess: false, status: 'no_request' };
      }

      return {
        hasAccess: data.status === 'approved',
        status: data.status
      };
    } catch (error: any) {
      console.error('Error checking tender access:', error);
      return { hasAccess: false, status: 'error' };
    }
  };

  return {
    accessRequests,
    myRequests,
    loading,
    requestTenderAccess,
    approveTenderAccess,
    rejectTenderAccess,
    checkTenderAccess,
    refreshRequests: () => {
      fetchAccessRequests();
      fetchMyRequests();
    }
  };
};

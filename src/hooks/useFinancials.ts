import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Budget {
  id: string;
  project_id: string;
  original_budget: number;
  revised_budget?: number;
  currency: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetCategory {
  id: string;
  project_id: string;
  name: string;
  category_type: string;
  allocated_amount: number;
  spent_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  project_id: string;
  invoice_number: string;
  vendor_name: string;
  vendor_email?: string;
  amount: number;
  tax_amount?: number;
  currency: string;
  status: 'pending' | 'approved' | 'paid' | 'overdue';
  invoice_date: string;
  due_date?: string;
  paid_date?: string;
  description?: string;
  category_id?: string;
  attachment_path?: string;
  created_by: string;
  approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  project_id: string;
  amount: number;
  recipient_name: string;
  payment_method: string;
  payment_date: string;
  description?: string;
  reference_number?: string;
  invoice_id?: string;
  created_by: string;
  created_at: string;
}

export interface ChangeOrder {
  id: string;
  project_id: string;
  order_number: string;
  title: string;
  description?: string;
  reason?: string;
  financial_impact: number;
  timeline_impact_days?: number;
  status: 'pending' | 'approved' | 'rejected' | 'implemented';
  requested_by: string;
  approved_by?: string;
  approval_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CashflowItem {
  id: string;
  project_id: string;
  item_type: 'income' | 'expense';
  description: string;
  amount: number;
  forecast_date: string;
  status: 'forecasted' | 'confirmed' | 'actual';
  category?: string;
  linked_invoice_id?: string;
  linked_payment_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClientContribution {
  id: string;
  project_id: string;
  contribution_type: 'deposit' | 'progress_payment' | 'final_payment' | 'variation';
  amount: number;
  description?: string;
  status: 'pending' | 'received' | 'overdue';
  expected_date?: string;
  received_date?: string;
  payment_method?: string;
  reference_number?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProgressClaim {
  id: string;
  project_id: string;
  claim_number: string;
  claim_date: string;
  month_period: string | null;
  status: 'draft' | 'submitted' | 'approved' | 'paid';
  total_works_completed_to_date: number;
  total_variations_included: number;
  total_amount_excl_gst: number;
  gst_applicable: number;
  total_amount_incl_gst: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LineItemBudget {
  id: string;
  project_id: string;
  item_number: number;
  item_name: string;
  description: string | null;
  category: string;
  contract_budget: number;
  revised_budget: number | null;
  percentage_complete: number;
  total_claimed_to_date: number;
  balance_to_claim: number;
  forecast_to_complete: number | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentStage {
  id: string;
  project_id: string;
  stage_number: number;
  stage_name: string;
  percentage_of_contract: number;
  completion_criteria: string | null;
  milestone_order: number;
  status: 'pending' | 'achieved' | 'released';
  created_at: string;
  updated_at: string;
}

export const useFinancials = (projectId?: string) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [cashflowItems, setCashflowItems] = useState<CashflowItem[]>([]);
  const [clientContributions, setClientContributions] = useState<ClientContribution[]>([]);
  const [progressClaims, setProgressClaims] = useState<ProgressClaim[]>([]);
  const [lineItemBudgets, setLineItemBudgets] = useState<LineItemBudget[]>([]);
  const [paymentStages, setPaymentStages] = useState<PaymentStage[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchFinancialData = async () => {
    if (!projectId || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Verify user is member of the project
      const { data: membership } = await supabase
        .from('project_users')
        .select('user_id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!membership) {
        setLoading(false);
        return;
      }

      // Fetch all financial data in parallel
      const [
        budgetsData,
        budgetCategoriesData,
        invoicesData,
        paymentsData,
        changeOrdersData,
        cashflowData,
        contributionsData,
        progressClaimsData,
        lineItemsData,
        paymentStagesData
      ] = await Promise.all([
        supabase.from('project_budgets').select('*').eq('project_id', projectId),
        supabase.from('budget_categories').select('*').eq('project_id', projectId),
        supabase.from('project_invoices').select('*').eq('project_id', projectId),
        supabase.from('project_payments').select('*').eq('project_id', projectId),
        supabase.from('change_orders').select('*').eq('project_id', projectId),
        supabase.from('cashflow_items').select('*').eq('project_id', projectId),
        supabase.from('client_contributions').select('*').eq('project_id', projectId),
        supabase.from('progress_claims').select('*').eq('project_id', projectId).order('created_at', { ascending: false }),
        supabase.from('line_item_budgets').select('*').eq('project_id', projectId).order('item_number', { ascending: true }),
        supabase.from('payment_stages').select('*').eq('project_id', projectId).order('milestone_order', { ascending: true })
      ]);

      setBudgets(budgetsData.data as Budget[] || []);
      setBudgetCategories(budgetCategoriesData.data as BudgetCategory[] || []);
      setInvoices(invoicesData.data as Invoice[] || []);
      setPayments(paymentsData.data as Payment[] || []);
      setChangeOrders(changeOrdersData.data as ChangeOrder[] || []);
      setCashflowItems(cashflowData.data as CashflowItem[] || []);
      setClientContributions(contributionsData.data as ClientContribution[] || []);
      setProgressClaims(progressClaimsData.data as ProgressClaim[] || []);
      setLineItemBudgets(lineItemsData.data as LineItemBudget[] || []);
      setPaymentStages(paymentStagesData.data as PaymentStage[] || []);

    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [projectId, user]);

  // Set up real-time subscriptions for instant updates
  useEffect(() => {
    if (!projectId) return;

    const channels = [];

    // Subscribe to budget changes
    const budgetChannel = supabase
      .channel('budget-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_budgets',
          filter: `project_id=eq.${projectId}`,
        },
        () => fetchFinancialData()
      )
      .subscribe();

    channels.push(budgetChannel);

    // Subscribe to budget category changes
    const budgetCategoryChannel = supabase
      .channel('budget-category-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budget_categories',
          filter: `project_id=eq.${projectId}`,
        },
        () => fetchFinancialData()
      )
      .subscribe();

    channels.push(budgetCategoryChannel);

    // Subscribe to invoice changes
    const invoiceChannel = supabase
      .channel('invoice-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_invoices',
          filter: `project_id=eq.${projectId}`,
        },
        () => fetchFinancialData()
      )
      .subscribe();

    channels.push(invoiceChannel);

    // Subscribe to payment changes
    const paymentChannel = supabase
      .channel('payment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_payments',
          filter: `project_id=eq.${projectId}`,
        },
        () => fetchFinancialData()
      )
      .subscribe();

    channels.push(paymentChannel);

    // Subscribe to change order changes
    const changeOrderChannel = supabase
      .channel('change-order-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'change_orders',
          filter: `project_id=eq.${projectId}`,
        },
        () => fetchFinancialData()
      )
      .subscribe();

    channels.push(changeOrderChannel);

    // Subscribe to cashflow changes
    const cashflowChannel = supabase
      .channel('cashflow-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cashflow_items',
          filter: `project_id=eq.${projectId}`,
        },
        () => fetchFinancialData()
      )
      .subscribe();

    channels.push(cashflowChannel);

    // Subscribe to client contribution changes
    const contributionChannel = supabase
      .channel('contribution-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_contributions',
          filter: `project_id=eq.${projectId}`,
        },
        () => fetchFinancialData()
      )
      .subscribe();

    channels.push(contributionChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [projectId]);

  return {
    budgets,
    budgetCategories,
    invoices,
    payments,
    changeOrders,
    cashflowItems,
    clientContributions,
    progressClaims,
    lineItemBudgets,
    paymentStages,
    loading,
    refetch: fetchFinancialData,
  };
};
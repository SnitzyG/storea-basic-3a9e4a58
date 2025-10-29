import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetOverview } from '@/components/financials/BudgetOverview';
import { CostBreakdown } from '@/components/financials/CostBreakdown';
import { InvoicesSection } from '@/components/financials/InvoicesSection';
import { PaymentsSection } from '@/components/financials/PaymentsSection';
import { ChangeOrdersSection } from '@/components/financials/ChangeOrdersSection';
import { ClientContributionsSection } from '@/components/financials/ClientContributionsSection';
import { CashflowForecast } from '@/components/financials/CashflowForecast';
import { ProgressBilling } from '@/components/financials/ProgressBilling';
import { ProgressClaimsSection } from '@/components/financials/ProgressClaimsSection';
import { LineItemBudgets } from '@/components/financials/LineItemBudgets';
import { PaymentScheduleStages } from '@/components/financials/PaymentScheduleStages';
import { ClaimsHistoryTable } from '@/components/financials/ClaimsHistoryTable';
import { VariationsDetailedSection } from '@/components/financials/VariationsDetailedSection';
import { ContractSummaryOverview } from '@/components/financials/ContractSummaryOverview';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, FileText, CreditCard, RefreshCw, Users, BarChart, Calendar, Receipt, Flag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface UserRole {
  role: 'homeowner' | 'architect' | 'contractor' | 'builder';
}

export default function Financials() {
  const { session } = useAuth();
  const { selectedProject } = useProjectSelection();
  const [userRole, setUserRole] = useState<UserRole['role']>('contractor');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id || !selectedProject?.id) return;

    const fetchUserRole = async () => {
      try {
        const { data: projectUser } = await supabase
          .from('project_users')
          .select('role')
          .eq('project_id', selectedProject.id)
          .eq('user_id', session.user.id)
          .single();

        if (projectUser) {
          setUserRole(projectUser.role);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [session, selectedProject]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please log in to access financials.</p>
      </div>
    );
  }

  if (!selectedProject) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please select a project to view financials.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isClientView = userRole === 'homeowner';
  const canManageFinancials = ['architect', 'contractor'].includes(userRole);

  return (
    <div className="container mx-auto py-6 space-y-6 relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
        <Card className="w-full max-w-md shadow-xl border-2">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <DollarSign className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold">Financials</CardTitle>
            <CardDescription className="text-lg">
              Coming Soon
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              We're working hard to bring you comprehensive financial management tools. Stay tuned!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Existing Content (kept intact but hidden behind overlay) */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-11">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="contract" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Contract</span>
          </TabsTrigger>
          {!isClientView && (
            <TabsTrigger value="claims" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Claims</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="breakdown" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Line Items</span>
          </TabsTrigger>
          {!isClientView && (
            <TabsTrigger value="schedule" className="flex items-center gap-2">
              <Flag className="h-4 w-4" />
              <span className="hidden sm:inline">Schedule</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Invoices</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          {!isClientView && (
            <TabsTrigger value="changes" className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Variations</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="contributions" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Client</span>
          </TabsTrigger>
          {!isClientView && (
            <TabsTrigger value="cashflow" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Cashflow</span>
            </TabsTrigger>
          )}
          {!isClientView && (
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <BudgetOverview projectId={selectedProject.id} userRole={userRole} />
        </TabsContent>

        <TabsContent value="contract">
          <ContractSummaryOverview projectId={selectedProject.id} />
        </TabsContent>

        {!isClientView && (
          <TabsContent value="claims" className="space-y-6">
            <ProgressClaimsSection projectId={selectedProject.id} userRole={userRole} />
            <ClaimsHistoryTable projectId={selectedProject.id} />
          </TabsContent>
        )}

        <TabsContent value="breakdown">
          <LineItemBudgets projectId={selectedProject.id} userRole={userRole} />
        </TabsContent>

        {!isClientView && (
          <TabsContent value="schedule">
            <PaymentScheduleStages projectId={selectedProject.id} userRole={userRole} />
          </TabsContent>
        )}

        <TabsContent value="invoices">
          <InvoicesSection projectId={selectedProject.id} userRole={userRole} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsSection projectId={selectedProject.id} userRole={userRole} />
        </TabsContent>

        {!isClientView && (
          <TabsContent value="changes">
            <VariationsDetailedSection projectId={selectedProject.id} userRole={userRole} />
          </TabsContent>
        )}

        <TabsContent value="contributions">
          <ClientContributionsSection projectId={selectedProject.id} userRole={userRole} />
        </TabsContent>

        {!isClientView && (
          <TabsContent value="cashflow">
            <CashflowForecast projectId={selectedProject.id} userRole={userRole} />
          </TabsContent>
        )}

        {!isClientView && (
          <TabsContent value="billing">
            <ProgressBilling projectId={selectedProject.id} userRole={userRole} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
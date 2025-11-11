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
    <div className="container mx-auto py-6 space-y-6">
      {/* Main Tabs */}
      <Tabs defaultValue="budgets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 bg-muted">
          <TabsTrigger value="budgets" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Budgets</span>
          </TabsTrigger>
          {!isClientView && (
            <TabsTrigger value="commitments" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Commitments</span>
            </TabsTrigger>
          )}
          {!isClientView && (
            <TabsTrigger value="claims" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Claims & Variations</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          {!isClientView && (
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <BarChart className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Budgets Section */}
        <TabsContent value="budgets" className="space-y-4">
          <Tabs defaultValue="project-budgets" className="space-y-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="project-budgets">Project Budgets</TabsTrigger>
              <TabsTrigger value="budget-actuals">Budget vs Actuals</TabsTrigger>
              <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
            </TabsList>

            <TabsContent value="project-budgets" className="space-y-6">
              <BudgetOverview projectId={selectedProject.id} userRole={userRole} />
              <ContractSummaryOverview projectId={selectedProject.id} />
            </TabsContent>

            <TabsContent value="budget-actuals">
              <LineItemBudgets projectId={selectedProject.id} userRole={userRole} />
            </TabsContent>

            <TabsContent value="forecasting">
              <PaymentScheduleStages projectId={selectedProject.id} userRole={userRole} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Commitments Section */}
        {!isClientView && (
          <TabsContent value="commitments" className="space-y-4">
            <Tabs defaultValue="subcontracts" className="space-y-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="subcontracts">Subcontracts</TabsTrigger>
                <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
                <TabsTrigger value="creditor-invoices">Creditor Invoices</TabsTrigger>
                <TabsTrigger value="committed-costs">Committed Costs</TabsTrigger>
              </TabsList>

              <TabsContent value="subcontracts">
                <Card>
                  <CardHeader>
                    <CardTitle>Subcontracts</CardTitle>
                    <CardDescription>Manage subcontractor agreements and commitments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Subcontract management coming soon. This will integrate with your Suppliers and Subcontractors tabs.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="purchase-orders">
                <Card>
                  <CardHeader>
                    <CardTitle>Purchase Orders</CardTitle>
                    <CardDescription>Track material and equipment purchase orders</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Purchase order tracking coming soon.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="creditor-invoices">
                <Card>
                  <CardHeader>
                    <CardTitle>Creditor Invoices</CardTitle>
                    <CardDescription>Manage invoices from suppliers and subcontractors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Creditor invoice management coming soon.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="committed-costs">
                <Card>
                  <CardHeader>
                    <CardTitle>Committed Costs</CardTitle>
                    <CardDescription>Overview of all committed project costs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Committed costs summary coming soon.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        )}

        {/* Claims & Variations Section */}
        {!isClientView && (
          <TabsContent value="claims" className="space-y-4">
            <Tabs defaultValue="progress-claims" className="space-y-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="progress-claims">Progress Claims</TabsTrigger>
                <TabsTrigger value="variations">Variations</TabsTrigger>
                <TabsTrigger value="retentions">Retentions</TabsTrigger>
              </TabsList>

              <TabsContent value="progress-claims" className="space-y-6">
                <ProgressClaimsSection projectId={selectedProject.id} userRole={userRole} />
                <ClaimsHistoryTable projectId={selectedProject.id} />
              </TabsContent>

              <TabsContent value="variations">
                <VariationsDetailedSection projectId={selectedProject.id} userRole={userRole} />
              </TabsContent>

              <TabsContent value="retentions">
                <Card>
                  <CardHeader>
                    <CardTitle>Retentions</CardTitle>
                    <CardDescription>Track retention amounts held and released</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Retention tracking coming soon. This will automatically calculate held and released amounts based on payment schedule.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        )}

        {/* Payments Section */}
        <TabsContent value="payments" className="space-y-4">
          <Tabs defaultValue="invoices" className="space-y-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="cashflow">Cashflow Summary</TabsTrigger>
              {!isClientView && <TabsTrigger value="wip">Work in Progress (WIP)</TabsTrigger>}
            </TabsList>

            <TabsContent value="invoices">
              <InvoicesSection projectId={selectedProject.id} userRole={userRole} />
            </TabsContent>

            <TabsContent value="payments">
              <PaymentsSection projectId={selectedProject.id} userRole={userRole} />
            </TabsContent>

            <TabsContent value="cashflow">
              <CashflowForecast projectId={selectedProject.id} userRole={userRole} />
            </TabsContent>

            {!isClientView && (
              <TabsContent value="wip">
                <ProgressBilling projectId={selectedProject.id} userRole={userRole} />
              </TabsContent>
            )}
          </Tabs>
        </TabsContent>

        {/* Integrations & Reports Section */}
        {!isClientView && (
          <TabsContent value="reports" className="space-y-4">
            <Tabs defaultValue="client-contributions" className="space-y-4">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="client-contributions">Client Contributions</TabsTrigger>
                <TabsTrigger value="integrations">Accounting Integrations</TabsTrigger>
                <TabsTrigger value="financial-reports">Financial Reports</TabsTrigger>
              </TabsList>

              <TabsContent value="client-contributions">
                <ClientContributionsSection projectId={selectedProject.id} userRole={userRole} />
              </TabsContent>

              <TabsContent value="integrations">
                <Card>
                  <CardHeader>
                    <CardTitle>Accounting Integrations</CardTitle>
                    <CardDescription>Connect to Xero, MYOB, or QuickBooks</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Accounting software integrations coming soon. Export your financial data to popular accounting platforms.</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="financial-reports">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Reports</CardTitle>
                    <CardDescription>Generate and download comprehensive financial reports</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Report generation coming soon. Download Budget, WIP, and Claim summaries in various formats.</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
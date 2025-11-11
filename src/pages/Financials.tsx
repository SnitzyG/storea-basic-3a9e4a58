import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BudgetOverview } from '@/components/financials/BudgetOverview';
import { InvoicesSection } from '@/components/financials/InvoicesSection';
import { PaymentsSection } from '@/components/financials/PaymentsSection';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, FileText, CreditCard, Users, BarChart, Receipt } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface UserRole {
  role: 'homeowner' | 'architect' | 'contractor' | 'builder';
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

export default function Financials() {
  const { session } = useAuth();
  const { selectedProject } = useProjectSelection();
  const [userRole, setUserRole] = useState<UserRole['role']>('contractor');
  const [loading, setLoading] = useState(true);
  const [builders, setBuilders] = useState<TeamMember[]>([]);
  const [architects, setArchitects] = useState<TeamMember[]>([]);
  const [clients, setClients] = useState<TeamMember[]>([]);
  const [selectedRoleView, setSelectedRoleView] = useState<'builder' | 'architect' | 'client'>('builder');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user?.id || !selectedProject?.id) return;

    const fetchUserRoleAndTeam = async () => {
      try {
        // Fetch current user's role
        const { data: projectUser } = await supabase
          .from('project_users')
          .select('role')
          .eq('project_id', selectedProject.id)
          .eq('user_id', session.user.id)
          .single();

        if (projectUser) {
          setUserRole(projectUser.role);
        }

        // Fetch all team members with their profiles
        const { data: teamMembers } = await supabase
          .from('project_users')
          .select('user_id, role, profiles(id, name)')
          .eq('project_id', selectedProject.id);

        if (teamMembers) {
          // Group by role
          const builderMembers = teamMembers
            .filter(m => m.role === 'builder' || m.role === 'contractor')
            .map(m => ({
              id: m.user_id,
              name: (m.profiles as any)?.name || 'Unknown',
              role: m.role
            }));
          
          const architectMembers = teamMembers
            .filter(m => m.role === 'architect')
            .map(m => ({
              id: m.user_id,
              name: (m.profiles as any)?.name || 'Unknown',
              role: m.role
            }));
          
          const clientMembers = teamMembers
            .filter(m => m.role === 'homeowner')
            .map(m => ({
              id: m.user_id,
              name: (m.profiles as any)?.name || 'Unknown',
              role: m.role
            }));

          setBuilders(builderMembers);
          setArchitects(architectMembers);
          setClients(clientMembers);

          // Set default selected user based on role
          if (projectUser?.role === 'homeowner') {
            setSelectedRoleView('architect');
            if (architectMembers.length > 0) {
              setSelectedUserId(architectMembers[0].id);
            }
          } else if (projectUser?.role === 'architect') {
            setSelectedRoleView('builder');
            if (builderMembers.length > 0) {
              setSelectedUserId(builderMembers[0].id);
            }
          } else {
            setSelectedRoleView('builder');
            setSelectedUserId(session.user.id);
          }
        }
      } catch (error) {
        console.error('Error fetching user role and team:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRoleAndTeam();
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
  const canViewBuilder = userRole === 'builder' || userRole === 'architect' || userRole === 'contractor';
  const canViewArchitect = userRole === 'homeowner' || userRole === 'architect';
  const canViewClient = userRole === 'builder' || userRole === 'architect' || userRole === 'contractor';

  const renderFinancialTabs = (viewRole: string, userId: string | null) => (
    <Tabs defaultValue="budgets" className="space-y-4">
      <TabsList className={cn("grid w-full", isClientView ? "grid-cols-2" : "grid-cols-5")}>
        <TabsTrigger value="budgets" className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          Budgets
        </TabsTrigger>
        {!isClientView && (
          <TabsTrigger value="commitments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Commitments
          </TabsTrigger>
        )}
        {!isClientView && (
          <TabsTrigger value="claims" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Claims & Variations
          </TabsTrigger>
        )}
        <TabsTrigger value="payments" className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Payments
        </TabsTrigger>
        {!isClientView && (
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Reports
          </TabsTrigger>
        )}
      </TabsList>

      {/* Budgets Section */}
      <TabsContent value="budgets" className="space-y-4">
        <Tabs defaultValue="project-budgets" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="project-budgets">Project Budgets</TabsTrigger>
            <TabsTrigger value="budget-actuals">Budget vs Actuals</TabsTrigger>
            <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          </TabsList>

          <TabsContent value="project-budgets" className="space-y-6">
            <BudgetOverview projectId={selectedProject.id} userRole={userRole} userId={userId} />
            <ContractSummaryOverview projectId={selectedProject.id} />
          </TabsContent>

          <TabsContent value="budget-actuals">
            <LineItemBudgets projectId={selectedProject.id} userRole={userRole} userId={userId} />
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
            <TabsList className="grid w-full grid-cols-4">
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
                  <p className="text-muted-foreground">Subcontract management coming soon.</p>
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="progress-claims">Progress Claims</TabsTrigger>
              <TabsTrigger value="variations">Variations</TabsTrigger>
              <TabsTrigger value="retentions">Retentions</TabsTrigger>
            </TabsList>

            <TabsContent value="progress-claims" className="space-y-6">
              <ProgressClaimsSection projectId={selectedProject.id} userRole={userRole} userId={userId} />
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
                  <p className="text-muted-foreground">Retention tracking coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      )}

      {/* Payments Section */}
      <TabsContent value="payments" className="space-y-4">
        <Tabs defaultValue="invoices" className="space-y-4">
          <TabsList className={cn("grid w-full", isClientView ? "grid-cols-3" : "grid-cols-4")}>
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

      {/* Reports Section */}
      {!isClientView && (
        <TabsContent value="reports" className="space-y-4">
          <Tabs defaultValue="client-contributions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
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
                  <p className="text-muted-foreground">Accounting software integrations coming soon.</p>
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
                  <p className="text-muted-foreground">Report generation coming soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      )}
    </Tabs>
  );

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Tabs value={selectedRoleView} onValueChange={(value) => setSelectedRoleView(value as any)} className="space-y-6">
        <TabsList className={cn(
          "grid w-full",
          [canViewBuilder, canViewArchitect, canViewClient].filter(Boolean).length === 3 
            ? "grid-cols-3" 
            : "grid-cols-2"
        )}>
          {canViewBuilder && (
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Builder Financials
              {builders.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {builders.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          
          {canViewArchitect && (
            <TabsTrigger value="architect" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Architect Financials
            </TabsTrigger>
          )}
          
          {canViewClient && (
            <TabsTrigger value="client" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Client Financials
            </TabsTrigger>
          )}
        </TabsList>

        {/* Builder View */}
        <TabsContent value="builder" className="space-y-4">
          {builders.length > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">View financials for:</span>
                  <Select value={selectedUserId || undefined} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select builder" />
                    </SelectTrigger>
                    <SelectContent>
                      {builders.map(builder => (
                        <SelectItem key={builder.id} value={builder.id}>
                          {builder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
          
          {renderFinancialTabs('builder', selectedUserId || (builders.length > 0 ? builders[0].id : null))}
        </TabsContent>

        {/* Architect View */}
        <TabsContent value="architect" className="space-y-4">
          {architects.length > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">View financials for:</span>
                  <Select value={selectedUserId || undefined} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select architect" />
                    </SelectTrigger>
                    <SelectContent>
                      {architects.map(architect => (
                        <SelectItem key={architect.id} value={architect.id}>
                          {architect.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
          
          {renderFinancialTabs('architect', selectedUserId || (architects.length > 0 ? architects[0].id : null))}
        </TabsContent>

        {/* Client View */}
        <TabsContent value="client" className="space-y-4">
          {clients.length > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">View financials for:</span>
                  <Select value={selectedUserId || undefined} onValueChange={setSelectedUserId}>
                    <SelectTrigger className="w-[280px]">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
          
          {renderFinancialTabs('client', selectedUserId || (clients.length > 0 ? clients[0].id : null))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

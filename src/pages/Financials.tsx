import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjectSelection } from '@/context/ProjectSelectionContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent } from '@/components/ui/tabs';
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
import {
  RoleFilterTabsList,
  RoleFilterTabsTrigger,
  MainFinancialTabsList,
  MainFinancialTabsTrigger,
  SubTabsList,
  SubTabsTrigger,
} from '@/components/financials/FinancialTabStyles';

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
      <MainFinancialTabsList>
        <MainFinancialTabsTrigger value="budgets">
          <DollarSign className="h-4 w-4 mr-2" />
          Budgets
        </MainFinancialTabsTrigger>
        {!isClientView && (
          <MainFinancialTabsTrigger value="commitments">
            <FileText className="h-4 w-4 mr-2" />
            Commitments
          </MainFinancialTabsTrigger>
        )}
        {!isClientView && (
          <MainFinancialTabsTrigger value="claims">
            <Receipt className="h-4 w-4 mr-2" />
            Claims & Variations
          </MainFinancialTabsTrigger>
        )}
        <MainFinancialTabsTrigger value="payments">
          <CreditCard className="h-4 w-4 mr-2" />
          Payments
        </MainFinancialTabsTrigger>
        {!isClientView && (
          <MainFinancialTabsTrigger value="reports">
            <BarChart className="h-4 w-4 mr-2" />
            Reports
          </MainFinancialTabsTrigger>
        )}
      </MainFinancialTabsList>

      {/* Budgets Section */}
      <TabsContent value="budgets" className="space-y-4">
        <Tabs defaultValue="project-budgets" className="space-y-4">
          <SubTabsList>
            <SubTabsTrigger value="project-budgets">Project Budgets</SubTabsTrigger>
            <SubTabsTrigger value="budget-actuals">Budget vs Actuals</SubTabsTrigger>
            <SubTabsTrigger value="forecasting">Forecasting</SubTabsTrigger>
          </SubTabsList>

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
            <SubTabsList>
              <SubTabsTrigger value="subcontracts">Subcontracts</SubTabsTrigger>
              <SubTabsTrigger value="purchase-orders">Purchase Orders</SubTabsTrigger>
              <SubTabsTrigger value="creditor-invoices">Creditor Invoices</SubTabsTrigger>
              <SubTabsTrigger value="committed-costs">Committed Costs</SubTabsTrigger>
            </SubTabsList>

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
            <SubTabsList>
              <SubTabsTrigger value="progress-claims">Progress Claims</SubTabsTrigger>
              <SubTabsTrigger value="variations">Variations</SubTabsTrigger>
              <SubTabsTrigger value="retentions">Retentions</SubTabsTrigger>
            </SubTabsList>

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
          <SubTabsList>
            <SubTabsTrigger value="invoices">Invoices</SubTabsTrigger>
            <SubTabsTrigger value="payments">Payments</SubTabsTrigger>
            <SubTabsTrigger value="cashflow">Cashflow Summary</SubTabsTrigger>
            {!isClientView && <SubTabsTrigger value="wip">Work in Progress (WIP)</SubTabsTrigger>}
          </SubTabsList>

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
            <SubTabsList>
              <SubTabsTrigger value="client-contributions">Client Contributions</SubTabsTrigger>
              <SubTabsTrigger value="integrations">Accounting Integrations</SubTabsTrigger>
              <SubTabsTrigger value="financial-reports">Financial Reports</SubTabsTrigger>
            </SubTabsList>

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
        <RoleFilterTabsList className={cn(
          [canViewBuilder, canViewArchitect, canViewClient].filter(Boolean).length === 3 
            ? "grid-cols-3" 
            : "grid-cols-2"
        )}>
          {canViewBuilder && (
            <RoleFilterTabsTrigger value="builder">
              <Users className="h-5 w-5 mr-2" />
              Builder Financials
              {builders.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {builders.length}
                </Badge>
              )}
            </RoleFilterTabsTrigger>
          )}
          
          {canViewArchitect && (
            <RoleFilterTabsTrigger value="architect">
              <FileText className="h-5 w-5 mr-2" />
              Architect Financials
            </RoleFilterTabsTrigger>
          )}
          
          {canViewClient && (
            <RoleFilterTabsTrigger value="client">
              <DollarSign className="h-5 w-5 mr-2" />
              Client Financials
            </RoleFilterTabsTrigger>
          )}
        </RoleFilterTabsList>

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

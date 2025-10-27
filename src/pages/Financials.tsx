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
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, FileText, CreditCard, RefreshCw, Users, BarChart, Calendar } from 'lucide-react';
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Financials</h1>
          <p className="text-muted-foreground">Comprehensive financial management and tracking</p>
        </div>
        <Badge variant={isClientView ? "secondary" : "default"} className="px-3 py-1">
          {isClientView ? "Client View" : "Professional View"}
        </Badge>
      </div>

      {/* Budget Overview - Always visible */}
      <BudgetOverview projectId={selectedProject.id} userRole={userRole} />

      <Tabs defaultValue="breakdown" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="breakdown" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Breakdown</span>
          </TabsTrigger>
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
              <span className="hidden sm:inline">Changes</span>
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

        <TabsContent value="breakdown">
          <CostBreakdown projectId={selectedProject.id} userRole={userRole} />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesSection projectId={selectedProject.id} userRole={userRole} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsSection projectId={selectedProject.id} userRole={userRole} />
        </TabsContent>

        {!isClientView && (
          <TabsContent value="changes">
            <ChangeOrdersSection projectId={selectedProject.id} userRole={userRole} />
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
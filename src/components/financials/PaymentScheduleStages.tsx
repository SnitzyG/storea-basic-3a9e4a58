import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface PaymentStage {
  id: string;
  stage_number: number;
  stage_name: string;
  percentage_of_contract: number;
  completion_criteria: string | null;
  milestone_order: number;
  status: 'pending' | 'achieved' | 'released';
}

interface PaymentScheduleStagesProps {
  projectId: string;
  userRole: string;
}

const DEFAULT_STAGES = [
  { name: 'Deposit', percentage: 5, criteria: 'Initial deposit upon contract signing' },
  { name: 'Demolition', percentage: 5, criteria: 'Completion of demolition works' },
  { name: 'Structural Steel', percentage: 10, criteria: 'Structural steel installation complete' },
  { name: 'Frame Completed', percentage: 20, criteria: 'Building frame fully erected' },
  { name: 'Roof Installed', percentage: 20, criteria: 'Roof structure and covering complete' },
  { name: 'Lockup Stage', percentage: 10, criteria: 'All windows and doors installed' },
  { name: 'Internal Linings', percentage: 10, criteria: 'Internal wall linings complete' },
  { name: 'Fix Stage', percentage: 10, criteria: 'All fixtures and fittings installed' },
  { name: 'Final Stage', percentage: 10, criteria: 'Practical completion' },
];

export function PaymentScheduleStages({ projectId, userRole }: PaymentScheduleStagesProps) {
  const [stages, setStages] = useState<PaymentStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);

  const canManageSchedule = ['architect', 'contractor', 'builder'].includes(userRole);

  const fetchStages = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_stages')
        .select('*')
        .eq('project_id', projectId)
        .order('milestone_order', { ascending: true });

      if (error) throw error;
      setStages((data || []) as PaymentStage[]);
    } catch (error) {
      console.error('Error fetching payment stages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, [projectId]);

  const handleSetupDefaultSchedule = async () => {
    try {
      const stagesToInsert = DEFAULT_STAGES.map((stage, index) => ({
        project_id: projectId,
        stage_number: index + 1,
        stage_name: stage.name,
        percentage_of_contract: stage.percentage,
        completion_criteria: stage.criteria,
        milestone_order: index + 1,
        status: 'pending' as const,
      }));

      const { error } = await supabase
        .from('payment_stages')
        .insert(stagesToInsert);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment schedule created successfully",
      });

      setSetupDialogOpen(false);
      fetchStages();
    } catch (error) {
      console.error('Error creating payment schedule:', error);
      toast({
        title: "Error",
        description: "Failed to create payment schedule",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStageStatus = async (stageId: string, newStatus: 'pending' | 'achieved' | 'released') => {
    try {
      const { error } = await supabase
        .from('payment_stages')
        .update({ status: newStatus })
        .eq('id', stageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stage status updated",
      });

      fetchStages();
    } catch (error) {
      console.error('Error updating stage status:', error);
      toast({
        title: "Error",
        description: "Failed to update stage status",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'achieved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'released':
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'secondary',
      achieved: 'default',
      released: 'default',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getTotalReleased = () => {
    return stages
      .filter(s => s.status === 'released')
      .reduce((sum, s) => sum + s.percentage_of_contract, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (stages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Schedule</CardTitle>
          <CardDescription>Milestone-based payment tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No payment schedule set up yet</p>
            {canManageSchedule && (
              <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Setup Payment Schedule
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Setup Payment Schedule</DialogTitle>
                    <DialogDescription>
                      Create a standard milestone-based payment schedule
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Stage</TableHead>
                          <TableHead>%</TableHead>
                          <TableHead>Criteria</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {DEFAULT_STAGES.map((stage, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{stage.name}</TableCell>
                            <TableCell>{stage.percentage}%</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{stage.criteria}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSetupDefaultSchedule}>Create Schedule</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment Schedule</CardTitle>
            <CardDescription>Milestone-based payment tracking</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Released</p>
            <p className="text-2xl font-bold">{getTotalReleased()}%</p>
          </div>
        </div>
        <Progress value={getTotalReleased()} className="mt-2" />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Completion Criteria</TableHead>
              <TableHead>% of Contract</TableHead>
              <TableHead>Status</TableHead>
              {canManageSchedule && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {stages.map((stage) => (
              <TableRow key={stage.id}>
                <TableCell>{getStatusIcon(stage.status)}</TableCell>
                <TableCell className="font-medium">{stage.stage_name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {stage.completion_criteria}
                </TableCell>
                <TableCell className="font-semibold">{stage.percentage_of_contract}%</TableCell>
                <TableCell>{getStatusBadge(stage.status)}</TableCell>
                {canManageSchedule && (
                  <TableCell>
                    <div className="flex gap-2">
                      {stage.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStageStatus(stage.id, 'achieved')}
                        >
                          Mark Achieved
                        </Button>
                      )}
                      {stage.status === 'achieved' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateStageStatus(stage.id, 'released')}
                        >
                          Release Payment
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
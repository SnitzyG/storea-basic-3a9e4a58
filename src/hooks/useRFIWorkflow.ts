import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';
import { RFI } from './useRFIs';

export type WorkflowState = 
  | 'draft'
  | 'review'
  | 'additional_input_required'
  | 'revision_required'
  | 'approved'
  | 'responded'
  | 'closed';

export type WorkflowAction = 
  | 'submit_for_review'
  | 'approve'
  | 'request_additional_input'
  | 'request_revision'
  | 'provide_input'
  | 'respond'
  | 'close';

export interface WorkflowTransition {
  id: string;
  rfi_id: string;
  from_state: WorkflowState;
  to_state: WorkflowState;
  action: WorkflowAction;
  user_id: string;
  notes?: string;
  created_at: string;
  user_profile?: {
    name: string;
    role: string;
  };
}

export interface WorkflowConfiguration {
  auto_assign_reviewers: boolean;
  required_approvals: number;
  enable_parallel_review: boolean;
  auto_close_on_response: boolean;
  reminder_schedule: {
    first_reminder: number; // days
    second_reminder: number; // days
    escalation: number; // days
  };
}

export const useRFIWorkflow = (rfiId?: string) => {
  const [currentState, setCurrentState] = useState<WorkflowState>('draft');
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [possibleActions, setPossibleActions] = useState<WorkflowAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<WorkflowConfiguration>({
    auto_assign_reviewers: true,
    required_approvals: 1,
    enable_parallel_review: true,
    auto_close_on_response: false,
    reminder_schedule: {
      first_reminder: 3,
      second_reminder: 7,
      escalation: 14
    }
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Load workflow state and history
  const loadWorkflowData = useCallback(async () => {
    if (!rfiId) return;

    try {
      // Get current RFI state
      const { data: rfi, error: rfiError } = await supabase
        .from('rfis')
        .select('status')
        .eq('id', rfiId)
        .single();

      if (rfiError) throw rfiError;

      // Map RFI status to workflow state
      const mappedState = mapRFIStatusToWorkflowState(rfi.status);
      setCurrentState(mappedState);

      // Get workflow transitions
      const { data: transitionsData, error: transitionsError } = await (supabase as any)
        .from('rfi_workflow_transitions')
        .select(`
          *,
          user_profile:profiles!user_id (
            name,
            role
          )
        `)
        .eq('rfi_id', rfiId)
        .order('created_at', { ascending: false });

      if (transitionsError) throw transitionsError;

      setTransitions(transitionsData || []);

      // Calculate possible actions based on current state and user permissions
      const actions = calculatePossibleActions(mappedState, user?.id, rfi);
      setPossibleActions(actions);

    } catch (error) {
      console.error('Error loading workflow data:', error);
      toast({
        title: "Error",
        description: "Failed to load workflow data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [rfiId, user?.id, toast]);

  // Execute workflow action
  const executeAction = async (
    action: WorkflowAction, 
    notes?: string,
    additionalData?: any
  ): Promise<boolean> => {
    if (!rfiId || !user) return false;

    try {
      const newState = getNextState(currentState, action);
      
      // Start transaction by creating transition record
      const { data: transition, error: transitionError } = await (supabase as any)
        .from('rfi_workflow_transitions')
        .insert({
          rfi_id: rfiId,
          from_state: currentState,
          to_state: newState,
          action,
          user_id: user.id,
          notes
        })
        .select()
        .single();

      if (transitionError) throw transitionError;

      // Update RFI status
      const rfiStatus = mapWorkflowStateToRFIStatus(newState);
      const { error: updateError } = await supabase
        .from('rfis')
        .update({ 
          status: rfiStatus,
          updated_at: new Date().toISOString(),
          ...additionalData 
        })
        .eq('id', rfiId);

      if (updateError) throw updateError;

      // Log RFI activity
      await supabase
        .from('rfi_activities')
        .insert({
          rfi_id: rfiId,
          user_id: user.id,
          action: `workflow_${action}`,
          details: `Workflow action: ${action}${notes ? ` - ${notes}` : ''}`
        });

      // Handle automatic actions based on new state
      await handleAutomaticActions(rfiId, newState, action);

      // Update local state
      setCurrentState(newState);
      loadWorkflowData();

      toast({
        title: "Success",
        description: `Action "${action}" completed successfully`,
      });

      return true;
    } catch (error) {
      console.error('Error executing workflow action:', error);
      toast({
        title: "Error",
        description: "Failed to execute workflow action",
        variant: "destructive",
      });
      return false;
    }
  };

  // Check if user can execute specific action
  const canExecuteAction = (action: WorkflowAction): boolean => {
    return possibleActions.includes(action);
  };

  // Get workflow progress percentage
  const getProgressPercentage = (): number => {
    const stateOrder: WorkflowState[] = [
      'draft', 'review', 'additional_input_required', 
      'revision_required', 'approved', 'responded', 'closed'
    ];
    
    const currentIndex = stateOrder.indexOf(currentState);
    return Math.round((currentIndex / (stateOrder.length - 1)) * 100);
  };

  // Schedule automatic reminders
  const scheduleReminders = async (rfiId: string) => {
    try {
      const { error } = await supabase.functions.invoke('schedule-rfi-reminders', {
        body: {
          rfi_id: rfiId,
          reminder_schedule: config.reminder_schedule
        }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  };

  useEffect(() => {
    loadWorkflowData();
  }, [loadWorkflowData]);

  return {
    currentState,
    transitions,
    possibleActions,
    loading,
    config,
    executeAction,
    canExecuteAction,
    getProgressPercentage,
    scheduleReminders,
    refetch: loadWorkflowData
  };
};

// Helper functions
function mapRFIStatusToWorkflowState(status: string): WorkflowState {
  const mapping: Record<string, WorkflowState> = {
    'outstanding': 'review',
    'overdue': 'review',
    'responded': 'responded',
    'closed': 'closed'
  };
  
  return mapping[status] || 'draft';
}

function mapWorkflowStateToRFIStatus(state: WorkflowState): string {
  const mapping: Record<WorkflowState, string> = {
    'draft': 'outstanding',
    'review': 'outstanding',
    'additional_input_required': 'outstanding',
    'revision_required': 'outstanding',
    'approved': 'outstanding',
    'responded': 'responded',
    'closed': 'closed'
  };
  
  return mapping[state];
}

function getNextState(currentState: WorkflowState, action: WorkflowAction): WorkflowState {
  const transitions: Record<WorkflowState, Partial<Record<WorkflowAction, WorkflowState>>> = {
    draft: {
      submit_for_review: 'review'
    },
    review: {
      approve: 'approved',
      request_additional_input: 'additional_input_required',
      request_revision: 'revision_required'
    },
    additional_input_required: {
      provide_input: 'review'
    },
    revision_required: {
      submit_for_review: 'review'
    },
    approved: {
      respond: 'responded'
    },
    responded: {
      close: 'closed'
    },
    closed: {}
  };

  return transitions[currentState]?.[action] || currentState;
}

function calculatePossibleActions(
  state: WorkflowState, 
  userId?: string, 
  rfi?: any
): WorkflowAction[] {
  if (!userId) return [];

  const actions: WorkflowAction[] = [];

  switch (state) {
    case 'draft':
      if (rfi?.raised_by === userId) {
        actions.push('submit_for_review');
      }
      break;
    case 'review':
      if (rfi?.assigned_to === userId) {
        actions.push('approve', 'request_additional_input', 'request_revision');
      }
      break;
    case 'additional_input_required':
      actions.push('provide_input');
      break;
    case 'revision_required':
      if (rfi?.raised_by === userId) {
        actions.push('submit_for_review');
      }
      break;
    case 'approved':
      if (rfi?.assigned_to === userId) {
        actions.push('respond');
      }
      break;
    case 'responded':
      if (rfi?.raised_by === userId) {
        actions.push('close');
      }
      break;
  }

  return actions;
}

async function handleAutomaticActions(
  rfiId: string, 
  newState: WorkflowState, 
  action: WorkflowAction
) {
  try {
    // Schedule reminders for review state
    if (newState === 'review') {
      await supabase.functions.invoke('schedule-rfi-reminders', {
        body: { rfi_id: rfiId }
      });
    }

    // Send notifications based on state changes
    if (newState === 'additional_input_required') {
      await supabase.functions.invoke('send-rfi-notification', {
        body: {
          rfi_id: rfiId,
          notification_type: 'additional_input_required'
        }
      });
    }

    // Auto-assign reviewers if configured
    if (newState === 'review') {
      await supabase.functions.invoke('auto-assign-rfi-reviewers', {
        body: { rfi_id: rfiId }
      });
    }
  } catch (error) {
    console.error('Error handling automatic actions:', error);
  }
}
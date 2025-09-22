import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Global real-time hook that sets up comprehensive real-time subscriptions
 * for all major data changes across the application. This ensures that
 * any changes in the database are immediately reflected across all components.
 */
export const useGlobalRealtime = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    console.log('Setting up global real-time subscriptions for user:', user.id);

    const channels = [];

    // Projects and project membership changes
    const projectsChannel = supabase
      .channel('global-projects')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
        },
        (payload) => {
          console.log('Global: Project change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:projects:change', { detail: payload }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_users',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Global: Project membership change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:project_users:change', { detail: payload }));
        }
      )
      .subscribe();

    channels.push(projectsChannel);

    // Documents and document-related changes
    const documentsChannel = supabase
      .channel('global-documents')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
        },
        (payload) => {
          console.log('Global: Document change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:documents:change', { detail: payload }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_groups',
        },
        (payload) => {
          console.log('Global: Document group change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:document_groups:change', { detail: payload }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'document_revisions',
        },
        (payload) => {
          console.log('Global: Document revision change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:document_revisions:change', { detail: payload }));
        }
      )
      .subscribe();

    channels.push(documentsChannel);

    // RFIs and RFI-related changes
    const rfisChannel = supabase
      .channel('global-rfis')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rfis',
        },
        (payload) => {
          console.log('Global: RFI change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:rfis:change', { detail: payload }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rfi_activities',
        },
        (payload) => {
          console.log('Global: RFI activity change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:rfi_activities:change', { detail: payload }));
        }
      )
      .subscribe();

    channels.push(rfisChannel);

    // Messages and message-related changes
    const messagesChannel = supabase
      .channel('global-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Global: Message change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:messages:change', { detail: payload }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_threads',
        },
        (payload) => {
          console.log('Global: Message thread change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:message_threads:change', { detail: payload }));
        }
      )
      .subscribe();

    channels.push(messagesChannel);

    // Tenders and tender-related changes
    const tendersChannel = supabase
      .channel('global-tenders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenders',
        },
        (payload) => {
          console.log('Global: Tender change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:tenders:change', { detail: payload }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tender_bids',
        },
        (payload) => {
          console.log('Global: Tender bid change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:tender_bids:change', { detail: payload }));
        }
      )
      .subscribe();

    channels.push(tendersChannel);

    // Todos and user-specific changes
    const userDataChannel = supabase
      .channel('global-user-data')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'todos',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Global: Todo change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:todos:change', { detail: payload }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Global: Notification change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:notifications:change', { detail: payload }));
        }
      )
      .subscribe();

    channels.push(userDataChannel);

    // Activity log changes
    const activityChannel = supabase
      .channel('global-activity')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activity_log',
        },
        (payload) => {
          console.log('Global: Activity log change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:activity_log:change', { detail: payload }));
        }
      )
      .subscribe();

    channels.push(activityChannel);

    // Financial data changes
    const financialChannel = supabase
      .channel('global-financial')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_budgets',
        },
        (payload) => {
          console.log('Global: Budget change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:project_budgets:change', { detail: payload }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_invoices',
        },
        (payload) => {
          console.log('Global: Invoice change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:project_invoices:change', { detail: payload }));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_payments',
        },
        (payload) => {
          console.log('Global: Payment change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:project_payments:change', { detail: payload }));
        }
      )
      .subscribe();

    channels.push(financialChannel);

    // Calendar events
    const calendarChannel = supabase
      .channel('global-calendar')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendar_events',
        },
        (payload) => {
          console.log('Global: Calendar event change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:calendar_events:change', { detail: payload }));
        }
      )
      .subscribe();

    channels.push(calendarChannel);

    // Profile changes
    const profilesChannel = supabase
      .channel('global-profiles')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('Global: Profile change detected', payload);
          window.dispatchEvent(new CustomEvent('supabase:profiles:change', { detail: payload }));
        }
      )
      .subscribe();

    channels.push(profilesChannel);

    console.log(`Global real-time: Set up ${channels.length} channels`);

    return () => {
      console.log('Cleaning up global real-time subscriptions');
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [user?.id]);
};
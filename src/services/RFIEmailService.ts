import { supabase } from '@/integrations/supabase/client';
import { RFI } from '@/hooks/useRFIs';

export interface EmailDeliveryStatus {
  id: string;
  rfi_id: string;
  recipient_email: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  attempt_count: number;
}

export const RFIEmailService = {
  /**
   * Send RFI via email with PDF attachment option
   */
  sendRFI: async (rfi: RFI, recipients: string[], includePDF: boolean = false): Promise<EmailDeliveryStatus[]> => {
    try {
      // First, log the email send attempt
      const deliveryStatuses: EmailDeliveryStatus[] = recipients.map(email => ({
        id: crypto.randomUUID(),
        rfi_id: rfi.id,
        recipient_email: email,
        status: 'pending' as const,
        attempt_count: 1
      }));

      // Store delivery status in database
      await (supabase as any)
        .from('rfi_email_delivery')
        .insert(deliveryStatuses.map(status => ({
          id: status.id,
          rfi_id: status.rfi_id,
          recipient_email: status.recipient_email,
          status: status.status,
          attempt_count: status.attempt_count
        })));

      // Call the edge function to send emails
      const { data, error } = await supabase.functions.invoke('send-rfi-email', {
        body: {
          rfi,
          recipients,
          includePDF,
          deliveryStatusIds: deliveryStatuses.map(s => s.id)
        }
      });

      if (error) {
        // Update all statuses to failed
        await (supabase as any)
          .from('rfi_email_delivery')
          .update({ 
            status: 'failed',
            error_message: error.message 
          })
          .in('id', deliveryStatuses.map(s => s.id));
        
        throw error;
      }

      // Log RFI activity
      await supabase
        .from('rfi_activities')
        .insert({
          rfi_id: rfi.id,
          user_id: rfi.raised_by,
          action: 'email_sent',
          details: `RFI sent via email to ${recipients.length} recipient(s)${includePDF ? ' with PDF attachment' : ''}`
        });

      return deliveryStatuses;
    } catch (error) {
      console.error('Error sending RFI email:', error);
      throw error;
    }
  },

  /**
   * Send follow-up reminder for overdue RFIs
   */
  sendReminder: async (rfi: RFI): Promise<boolean> => {
    try {
      if (!rfi.recipient_email) {
        throw new Error('No recipient email found for RFI');
      }

      const { error } = await supabase.functions.invoke('send-rfi-reminder', {
        body: { rfi }
      });

      if (error) throw error;

      // Log activity
      await supabase
        .from('rfi_activities')
        .insert({
          rfi_id: rfi.id,
          user_id: rfi.raised_by,
          action: 'reminder_sent',
          details: `Follow-up reminder sent to ${rfi.recipient_email}`
        });

      return true;
    } catch (error) {
      console.error('Error sending RFI reminder:', error);
      throw error;
    }
  },

  /**
   * Notify stakeholders of status changes
   */
  sendStatusUpdate: async (rfi: RFI, statusChange: string, notifyList: string[] = []): Promise<boolean> => {
    try {
      const recipients = notifyList.length > 0 ? notifyList : [
        rfi.recipient_email,
        rfi.sender_email
      ].filter(Boolean) as string[];

      if (recipients.length === 0) {
        console.warn('No recipients found for status update notification');
        return false;
      }

      const { error } = await supabase.functions.invoke('send-rfi-status-update', {
        body: {
          rfi,
          statusChange,
          recipients
        }
      });

      if (error) throw error;

      // Log activity
      await supabase
        .from('rfi_activities')
        .insert({
          rfi_id: rfi.id,
          user_id: rfi.raised_by,
          action: 'status_notification_sent',
          details: `Status update notification sent: ${statusChange}`
        });

      return true;
    } catch (error) {
      console.error('Error sending RFI status update:', error);
      throw error;
    }
  },

  /**
   * Get email delivery status for an RFI
   */
  getDeliveryStatus: async (rfiId: string): Promise<EmailDeliveryStatus[]> => {
    try {
      const { data, error } = await (supabase as any)
        .from('rfi_email_delivery')
        .select('*')
        .eq('rfi_id', rfiId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching email delivery status:', error);
      return [];
    }
  },

  /**
   * Retry failed email delivery
   */
  retryEmailDelivery: async (deliveryStatusId: string): Promise<boolean> => {
    try {
      const { data: status, error: fetchError } = await (supabase as any)
        .from('rfi_email_delivery')
        .select('*, rfis(*)')
        .eq('id', deliveryStatusId)
        .maybeSingle();

      if (fetchError || !status) throw fetchError || new Error('Delivery status not found');

      if (status.attempt_count >= 3) {
        throw new Error('Maximum retry attempts reached');
      }

      // Increment attempt count
      await (supabase as any)
        .from('rfi_email_delivery')
        .update({ 
          attempt_count: status.attempt_count + 1,
          status: 'pending'
        })
        .eq('id', deliveryStatusId);

      // Retry sending
      const { error } = await supabase.functions.invoke('send-rfi-email', {
        body: {
          rfi: status.rfis,
          recipients: [status.recipient_email],
          includePDF: false,
          deliveryStatusIds: [deliveryStatusId],
          isRetry: true
        }
      });

      if (error) {
        await (supabase as any)
          .from('rfi_email_delivery')
          .update({ 
            status: 'failed',
            error_message: error.message 
          })
          .eq('id', deliveryStatusId);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error retrying email delivery:', error);
      throw error;
    }
  }
};
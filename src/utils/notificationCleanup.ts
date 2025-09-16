import { supabase } from '@/integrations/supabase/client';

/**
 * Clean up orphaned notifications and activity logs
 * Should be called when projects are deleted or periodically
 */
export const cleanupOrphanedData = async () => {
  try {
    // Clean up orphaned activity logs
    const { error: activityError } = await supabase
      .from('activity_log')
      .delete()
      .filter('project_id', 'not.in', `(select id from projects)`);

    if (activityError) {
      console.error('Error cleaning up orphaned activity logs:', activityError);
    }

    // Clean up orphaned notifications
    const { data: notifications } = await supabase
      .from('notifications')
      .select('id, data');

    if (notifications) {
      const orphanedNotificationIds: string[] = [];
      
      for (const notification of notifications) {
        const notificationData = notification.data as Record<string, any>;
        if (notificationData?.project_id) {
          const { data: projectExists } = await supabase
            .from('projects')
            .select('id')
            .eq('id', notificationData.project_id)
            .single();
          
          if (!projectExists) {
            orphanedNotificationIds.push(notification.id);
          }
        }
      }

      if (orphanedNotificationIds.length > 0) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .delete()
          .in('id', orphanedNotificationIds);

        if (notificationError) {
          console.error('Error cleaning up orphaned notifications:', notificationError);
        }
      }
    }

    console.log('Orphaned data cleanup completed successfully');
  } catch (error) {
    console.error('Error during orphaned data cleanup:', error);
  }
};

/**
 * Set up automatic cleanup when app loads
 */
export const setupAutomaticCleanup = () => {
  // Run cleanup on app load
  cleanupOrphanedData();
  
  // Run cleanup every 30 minutes
  const interval = setInterval(cleanupOrphanedData, 30 * 60 * 1000);
  
  return () => clearInterval(interval);
};
import { supabase } from '@/integrations/supabase/client';

export interface AdminAction {
  action: string;
  resourceType?: string;
  resourceId?: string;
  changes?: Record<string, any>;
}

export async function logAdminAction({
  action,
  resourceType,
  resourceId,
  changes,
}: AdminAction): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Cannot log admin action: No authenticated user');
      return;
    }

    const ipAddress = null;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;

    const { error } = await supabase
      .from('admin_activity_log')
      .insert({
        admin_id: user.id,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        changes: changes || null,
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (error) {
      console.error('Error logging admin action:', error);
    }
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}

export const AdminActions = {
  USER_APPROVED: 'user_approved',
  USER_DISABLED: 'user_disabled',
  USER_ENABLED: 'user_enabled',
  USER_DELETED: 'user_deleted',
  ROLE_CHANGED: 'role_changed',
  ALERT_RESOLVED: 'alert_resolved',
  ALERT_DISMISSED: 'alert_dismissed',
  PROJECT_DELETED: 'project_deleted',
  PROJECT_STATUS_CHANGED: 'project_status_changed',
  SETTINGS_UPDATED: 'settings_updated',
  CONFIG_CHANGED: 'config_changed',
  SECURITY_SCAN_INITIATED: 'security_scan_initiated',
  RLS_POLICY_MODIFIED: 'rls_policy_modified',
} as const;

export const AdminLogger = {
  async userApproved(userId: string, userName: string) {
    await logAdminAction({
      action: AdminActions.USER_APPROVED,
      resourceType: 'user',
      resourceId: userId,
      changes: { approved: true, user_name: userName },
    });
  },

  async userStatusChanged(userId: string, enabled: boolean) {
    await logAdminAction({
      action: enabled ? AdminActions.USER_ENABLED : AdminActions.USER_DISABLED,
      resourceType: 'user',
      resourceId: userId,
      changes: { enabled },
    });
  },

  async roleChanged(userId: string, oldRole: string, newRole: string) {
    await logAdminAction({
      action: AdminActions.ROLE_CHANGED,
      resourceType: 'user',
      resourceId: userId,
      changes: { old_role: oldRole, new_role: newRole },
    });
  },

  async alertResolved(alertId: string, alertType: string) {
    await logAdminAction({
      action: AdminActions.ALERT_RESOLVED,
      resourceType: 'alert',
      resourceId: alertId,
      changes: { alert_type: alertType },
    });
  },

  async projectDeleted(projectId: string, projectName: string) {
    await logAdminAction({
      action: AdminActions.PROJECT_DELETED,
      resourceType: 'project',
      resourceId: projectId,
      changes: { project_name: projectName },
    });
  },

  async settingsUpdated(settingKey: string, oldValue: any, newValue: any) {
    await logAdminAction({
      action: AdminActions.SETTINGS_UPDATED,
      resourceType: 'settings',
      changes: { key: settingKey, old_value: oldValue, new_value: newValue },
    });
  },
};

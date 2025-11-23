import { supabase } from '@/integrations/supabase/client';

// Temporary types until Supabase regenerates types
type AuditLog = any;
type AdminAlert = any;
type SystemMetric = any;
type UserSession = any;

// Helper function to verify admin role
async function requireAdminRole(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { data: isAdmin, error } = await supabase.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin'
  });

  if (error || !isAdmin) {
    throw new Error('Unauthorized: Admin role required');
  }
}

// GET SYSTEM ACTIVITY WITH FILTERS
export async function getSystemActivity(filters?: {
  userId?: string;
  entityType?: string;
  action?: string;
  projectId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}) {
  let query = (supabase as any)
    .from('activity_log')
    .select(`
      *,
      user:profiles!activity_log_user_id_fkey (
        name,
        user_id
      )
    `);

  if (filters?.userId) query = query.eq('user_id', filters.userId);
  if (filters?.entityType) query = query.eq('entity_type', filters.entityType);
  if (filters?.action) query = query.eq('action', filters.action);
  if (filters?.projectId) query = query.eq('project_id', filters.projectId);
  if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom.toISOString());
  if (filters?.dateTo) query = query.lte('created_at', filters.dateTo.toISOString());

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data || [];
}


// GET AUDIT LOGS WITH REAL DATA
export async function getAuditLogs(filters?: {
  action?: string;
  status?: 'success' | 'failed';
  dateFrom?: Date;
  dateTo?: Date;
}) {
  let query = (supabase as any)
    .from('audit_logs')
    .select('id, admin_id, action, resource_type, resource_id, resource_name, status, created_at, error_message');

  if (filters?.action) query = query.eq('action', filters.action);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom.toISOString());
  if (filters?.dateTo) query = query.lte('created_at', filters.dateTo.toISOString());

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data || [];
}

// GET ALL USERS FROM AUTH
export async function getAllUsers() {
  await requireAdminRole();
  
  const { data: users, error } = await supabase.auth.admin.listUsers();
  if (error) throw new Error(error.message);
  
  return users?.users?.map(user => ({
    id: user.id,
    email: user.email,
    role: user.user_metadata?.role || 'user',
    status: user.user_metadata?.disabled ? 'disabled' : 'active',
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at,
  })) || [];
}

// GET UNRESOLVED ALERTS ONLY
export async function getAdminAlerts() {
  const { data, error } = await (supabase as any)
    .from('admin_alerts')
    .select('*')
    .is('resolved_at', null)
    .order('severity', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data || [];
}

// GET SYSTEM METRICS - REAL TIME DATA
export async function getSystemMetrics() {
  const { data, error } = await (supabase as any)
    .from('system_metrics')
    .select('metric_type, value, unit, recorded_at')
    .order('recorded_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  
  // Return latest value for each metric type
  const latest: Record<string, any> = {};
  data?.forEach(metric => {
    if (!latest[metric.metric_type]) {
      latest[metric.metric_type] = metric;
    }
  });
  
  return latest;
}

// DISABLE USER - LOGS TO AUDIT TRAIL
export async function disableUser(userId: string, reason: string) {
  await requireAdminRole();
  
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('Not authenticated');

  try {
    // Get user data before change
    const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(userId);
    if (getUserError) throw getUserError;

    const oldStatus = userData.user?.user_metadata?.disabled ? 'disabled' : 'active';

    // Disable user
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { 
        disabled: true,
        disabledReason: reason,
        disabledAt: new Date().toISOString(),
        disabledBy: currentUser.id
      }
    });

    if (updateError) throw updateError;

    // Log to audit trail
    await (supabase as any).from('audit_logs').insert({
      admin_id: currentUser.id,
      action: 'user_disabled',
      resource_type: 'user',
      resource_id: userId,
      resource_name: userData?.user?.email || null,
      old_value: { status: oldStatus },
      new_value: { status: 'disabled', reason },
      status: 'success'
    });

    return { success: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    // Log failed attempt
    const result = await supabase.auth.getUser();
    const user2 = result.data.user;
    if (user2) {
      await (supabase as any).from('audit_logs').insert({
        admin_id: user2.id,
        action: 'user_disabled',
        resource_type: 'user',
        resource_id: userId,
        status: 'failed',
        error_message: errorMsg
      });
    }
    throw error;
  }
}

// ENABLE USER - LOGS TO AUDIT TRAIL
export async function enableUser(userId: string) {
  await requireAdminRole();
  
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('Not authenticated');

  try {
    const { data: userData } = await supabase.auth.admin.getUserById(userId);

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { 
        disabled: false,
        enabledAt: new Date().toISOString(),
        enabledBy: currentUser.id
      }
    });

    if (error) throw error;

    await (supabase as any).from('audit_logs').insert({
      admin_id: currentUser.id,
      action: 'user_enabled',
      resource_type: 'user',
      resource_id: userId,
      resource_name: userData?.user?.email || null,
      old_value: { status: 'disabled' },
      new_value: { status: 'active' },
      status: 'success'
    });

    return { success: true };
  } catch (error) {
    throw error;
  }
}

// CHANGE USER ROLE - LOGS TO AUDIT TRAIL
export async function changeUserRole(userId: string, newRole: string) {
  await requireAdminRole();
  
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('Not authenticated');

  try {
    const { data: userData } = await supabase.auth.admin.getUserById(userId);
    const oldRole = userData.user?.user_metadata?.role || 'user';

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { 
        role: newRole,
        roleChangedAt: new Date().toISOString(),
        roleChangedBy: currentUser.id
      }
    });

    if (error) throw error;

    await (supabase as any).from('audit_logs').insert({
      admin_id: currentUser.id,
      action: 'user_role_changed',
      resource_type: 'user',
      resource_id: userId,
      resource_name: userData?.user?.email || null,
      old_value: { role: oldRole },
      new_value: { role: newRole },
      status: 'success'
    });

    return { success: true };
  } catch (error) {
    throw error;
  }
}

// MARK ALERT AS READ
export async function markAlertAsRead(alertId: string) {
  const { error } = await (supabase as any)
    .from('admin_alerts')
    .update({ is_read: true })
    .eq('id', alertId);

  if (error) throw new Error(error.message);
  return { success: true };
}

// RESOLVE ALERT
export async function resolveAlert(alertId: string) {
  const { error } = await (supabase as any)
    .from('admin_alerts')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', alertId);

  if (error) throw new Error(error.message);
  return { success: true };
}

// DELETE ALERT
export async function deleteAlert(alertId: string) {
  const { error } = await (supabase as any)
    .from('admin_alerts')
    .delete()
    .eq('id', alertId);

  if (error) throw new Error(error.message);
  return { success: true };
}

// LOG CUSTOM ACTION TO AUDIT TRAIL
export async function logAction(
  action: string,
  resourceType: string,
  resourceId: string | null,
  resourceName: string | null,
  oldValue: any,
  newValue: any
) {
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error('Not authenticated');

  const { error } = await (supabase as any).from('audit_logs').insert({
    admin_id: currentUser.id,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    resource_name: resourceName,
    old_value: oldValue,
    new_value: newValue,
    status: 'success'
  });

  if (error) throw new Error(error.message);
}

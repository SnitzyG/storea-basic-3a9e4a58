/**
 * Admin Dashboard End-to-End Test Script
 * 
 * This script tests:
 * 1. Creating a test admin user
 * 2. Dashboard loading with real-time stats
 * 3. Notification system with alerts
 * 4. Sidebar badges updating in real-time
 * 5. Admin activity logging
 */

import { supabase } from '@/integrations/supabase/client';
import { AdminLogger } from './adminActivityLogger';

export class AdminDashboardTester {
  private testUserId: string | null = null;

  /**
   * Step 1: Create a test admin user
   */
  async createTestAdminUser() {
    console.log('📝 Creating test admin user...');
    
    try {
      // Sign up a new user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin-test@storea.com.au',
        password: 'AdminTest123!',
        options: {
          data: {
            role: 'system_admin',
            full_name: 'Test Admin User',
          },
        },
      });

      if (authError) throw authError;
      
      this.testUserId = authData.user?.id || null;
      console.log('✅ Test admin user created:', this.testUserId);

      // Update profile to admin role (if profiles table exists)
      if (this.testUserId) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: 'system_admin' })
          .eq('id', this.testUserId);

        if (profileError) {
          console.warn('⚠️ Could not update profile role:', profileError.message);
        }
      }

      return { success: true, userId: this.testUserId };
    } catch (error) {
      console.error('❌ Failed to create test admin user:', error);
      return { success: false, error };
    }
  }

  /**
   * Step 2: Test dashboard stats loading
   */
  async testDashboardStats() {
    console.log('📊 Testing dashboard stats...');
    
    try {
      // Check if get_system_health function exists
      const { data, error } = await supabase.rpc('get_system_health');
      
      if (error) {
        console.warn('⚠️ get_system_health RPC not available:', error.message);
        return { success: false, error };
      }

      console.log('✅ Dashboard stats loaded:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Failed to load dashboard stats:', error);
      return { success: false, error };
    }
  }

  /**
   * Step 3: Test notification system by creating alerts
   */
  async testNotificationSystem() {
    console.log('🔔 Testing notification system...');
    
    try {
      // Create a test critical alert
      const { data: criticalAlert, error: criticalError } = await supabase
        .from('admin_alerts')
        .insert({
          severity: 'critical',
          alert_type: 'test_alert',
          title: 'Test Critical Alert',
          message: 'This is a test critical alert for dashboard testing',
          metadata: { test: true, timestamp: new Date().toISOString() },
        })
        .select()
        .single();

      if (criticalError) throw criticalError;
      console.log('✅ Critical alert created:', criticalAlert.id);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create a test warning alert
      const { data: warningAlert, error: warningError } = await supabase
        .from('admin_alerts')
        .insert({
          severity: 'warning',
          alert_type: 'test_alert',
          title: 'Test Warning Alert',
          message: 'This is a test warning alert for dashboard testing',
          metadata: { test: true, timestamp: new Date().toISOString() },
        })
        .select()
        .single();

      if (warningError) throw warningError;
      console.log('✅ Warning alert created:', warningAlert.id);

      return { 
        success: true, 
        alerts: [criticalAlert, warningAlert] 
      };
    } catch (error) {
      console.error('❌ Failed to create test alerts:', error);
      return { success: false, error };
    }
  }

  /**
   * Step 4: Test real-time sidebar badge updates
   */
  async testRealtimeBadges() {
    console.log('🔄 Testing real-time badge updates...');
    
    return new Promise((resolve) => {
      let alertsReceived = 0;
      
      const channel = supabase
        .channel('test-realtime-badges')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'admin_alerts',
          },
          (payload) => {
            alertsReceived++;
            console.log('✅ Real-time alert received:', payload.new);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Subscribed to real-time updates');
            
            // Create a test alert after subscription
            setTimeout(async () => {
              await supabase
                .from('admin_alerts')
                .insert({
                  severity: 'info',
                  alert_type: 'realtime_test',
                  title: 'Real-time Test Alert',
                  message: 'Testing real-time badge updates',
                  metadata: { realtime_test: true },
                });
            }, 500);

            // Wait and check
            setTimeout(() => {
              supabase.removeChannel(channel);
              resolve({
                success: alertsReceived > 0,
                alertsReceived,
              });
            }, 3000);
          }
        });
    });
  }

  /**
   * Step 5: Test admin activity logging
   */
  async testActivityLogging() {
    console.log('📝 Testing admin activity logging...');
    
    try {
      // Test user approval logging
      await AdminLogger.userApproved('test-user-id', 'Test User');
      console.log('✅ User approval logged');

      // Test role change logging
      await AdminLogger.roleChanged('test-user-id', 'contractor', 'project_manager');
      console.log('✅ Role change logged');

      // Test alert resolution logging
      await AdminLogger.alertResolved('test-alert-id', 'test_alert');
      console.log('✅ Alert resolution logged');

      // Test settings update logging
      await AdminLogger.settingsUpdated('test_setting', 'old_value', 'new_value');
      console.log('✅ Settings update logged');

      // Verify logs were created
      const { data: logs, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      console.log('✅ Activity logs verified:', logs?.length, 'logs found');
      
      return { success: true, logsCreated: logs?.length || 0 };
    } catch (error) {
      console.error('❌ Failed to test activity logging:', error);
      return { success: false, error };
    }
  }

  /**
   * Cleanup test data
   */
  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    
    try {
      // Delete test alerts
      await supabase
        .from('admin_alerts')
        .delete()
        .or('alert_type.eq.test_alert,alert_type.eq.realtime_test');

      // Delete test activity logs
      await supabase
        .from('admin_activity_log')
        .delete()
        .eq('resource_id', 'test-user-id');

      console.log('✅ Cleanup completed');
      return { success: true };
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      return { success: false, error };
    }
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Starting Admin Dashboard End-to-End Tests\n');

    const results = {
      createUser: await this.createTestAdminUser(),
      dashboardStats: await this.testDashboardStats(),
      notifications: await this.testNotificationSystem(),
      realtimeBadges: await this.testRealtimeBadges(),
      activityLogging: await this.testActivityLogging(),
    };

    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    console.log('Create Admin User:', results.createUser.success ? '✅' : '❌');
    console.log('Dashboard Stats:', results.dashboardStats.success ? '✅' : '❌');
    console.log('Notifications:', results.notifications.success ? '✅' : '❌');
    console.log('Real-time Badges:', results.realtimeBadges.success ? '✅' : '❌');
    console.log('Activity Logging:', results.activityLogging.success ? '✅' : '❌');

    // Cleanup
    await this.cleanup();

    return results;
  }
}

// Export a convenience function to run tests
export async function runAdminDashboardTests() {
  const tester = new AdminDashboardTester();
  return await tester.runAllTests();
}

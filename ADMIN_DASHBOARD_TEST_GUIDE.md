# Admin Dashboard End-to-End Testing Guide

This guide provides comprehensive testing procedures for the admin dashboard features implemented in Phase 3.

## Prerequisites

1. Ensure you have database access to the Supabase project
2. Have admin credentials or ability to create an admin user
3. Access to browser developer tools for monitoring real-time updates

## Test 1: Create Test Admin User

### Steps:
1. **Option A: Via SQL (Recommended)**
   ```sql
   -- Update an existing user to system_admin role
   UPDATE profiles 
   SET role = 'system_admin' 
   WHERE email = 'your-email@example.com';
   ```

2. **Option B: Via Supabase Dashboard**
   - Go to Authentication → Users
   - Select a user
   - Update their `raw_user_meta_data` to include: `{"role": "system_admin"}`
   - Also update the profiles table for that user

### Expected Results:
- ✅ User role updated to `system_admin`
- ✅ User can access `/admin/dashboard` route
- ✅ User sees admin navigation in sidebar

---

## Test 2: Dashboard Overview Widget

### Steps:
1. Navigate to `/admin/dashboard`
2. Observe the Dashboard Overview Widget at the top
3. Check that the following metrics are displayed:
   - Total Users
   - Online Now
   - System Uptime (should show ~99.9%)
   - Critical Alerts count

4. Verify the quick stats section shows:
   - Active Projects / Total Projects
   - Open RFIs / Total RFIs
   - Pending Approvals
   - Messages (24h)

### Expected Results:
- ✅ All metrics load without errors
- ✅ Numbers are accurate and realistic
- ✅ Widget updates every 30 seconds automatically
- ✅ Clicking on stat cards navigates to relevant pages
- ✅ If pending approvals > 0, shows "Review X Pending Approval(s)" button

### Console Commands to Verify:
```javascript
// Open browser console and check for errors
console.log('Check for any Supabase connection errors');

// Manually trigger a stat update
window.location.reload();
```

---

## Test 3: Real-Time Admin Notifications

### Steps:
1. Keep admin dashboard open
2. Open a second browser tab/window
3. In the second tab, navigate to Supabase SQL Editor
4. Run the following SQL to create a critical alert:
   ```sql
   INSERT INTO admin_alerts (severity, alert_type, title, message)
   VALUES ('critical', 'test_alert', 'Test Critical Alert', 'This is a test notification');
   ```

5. Switch back to the admin dashboard tab
6. Observe the notification

### Expected Results:
- ✅ Toast notification appears immediately (within 1-2 seconds)
- ✅ Notification shows alert icon (AlertTriangle for critical)
- ✅ Notification displays for 10 seconds (critical) or 5 seconds (error)
- ✅ Critical alerts have red border (`border-destructive`)
- ✅ Error alerts have orange border
- ✅ For specific alert types, "View" button appears and navigates correctly:
  - `pending_approvals` → `/admin/approvals`
  - `rfi_overdue` → `/admin/activity`
  - `budget_overrun` → `/financials`
  - `failed_login` → `/admin/logs`

### Test Different Severities:
```sql
-- Test error severity
INSERT INTO admin_alerts (severity, alert_type, title, message)
VALUES ('error', 'test_alert', 'Test Error Alert', 'This is a test error notification');

-- Test warning severity (should NOT show notification)
INSERT INTO admin_alerts (severity, alert_type, title, message)
VALUES ('warning', 'test_warning', 'Test Warning', 'This should not create a notification');
```

---

## Test 4: Real-Time Sidebar Badge Updates

### Steps:
1. Observe the admin sidebar (left navigation)
2. Note the badge counts on:
   - Alerts & Issues
   - Pending Approvals (if visible)

3. In SQL Editor, create new alerts:
   ```sql
   INSERT INTO admin_alerts (severity, alert_type, title, message)
   VALUES 
   ('critical', 'security_breach', 'Security Alert', 'Potential security issue'),
   ('error', 'system_error', 'System Error', 'System malfunction detected');
   ```

4. Watch the sidebar badges

### Expected Results:
- ✅ Badge counts update in real-time (within 1-2 seconds)
- ✅ Badges show correct count of unresolved alerts
- ✅ Badge uses `destructive` variant for critical alerts
- ✅ No page refresh required

### Verify Badge Decreases:
```sql
-- Resolve an alert
UPDATE admin_alerts 
SET resolved_at = NOW() 
WHERE alert_type = 'test_alert' 
LIMIT 1;
```
- ✅ Badge count decreases immediately

---

## Test 5: Admin Activity Logging

### Steps:
1. Perform various admin actions:
   - Approve a user (if user approval system exists)
   - Resolve an alert from dashboard
   - Change user settings

2. Navigate to `/admin/logs` (Audit Logs page)

3. Verify recent activity appears

### Manual Test via Code:
Open browser console on admin dashboard and run:
```javascript
import { AdminLogger } from '@/utils/adminActivityLogger';

// Test user approval logging
await AdminLogger.userApproved('test-user-123', 'John Doe');

// Test role change logging
await AdminLogger.roleChanged('test-user-123', 'contractor', 'builder');

// Test alert resolution
await AdminLogger.alertResolved('alert-123', 'security_alert');
```

### Expected Results:
- ✅ Activity log entries are created in `admin_activity_log` table
- ✅ Each entry includes:
  - Admin ID (from current session)
  - Action type
  - Resource type and ID
  - Changes object
  - Timestamp
  - User agent
- ✅ Logs appear on `/admin/logs` page
- ✅ Logs are searchable and filterable

### Verify in Database:
```sql
SELECT 
  action, 
  resource_type, 
  resource_id, 
  changes, 
  created_at,
  admin_id
FROM admin_activity_log 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## Test 6: Enhanced Admin Sidebar Navigation

### Steps:
1. Navigate to `/admin/dashboard`
2. Observe the admin sidebar
3. Check navigation items:
   - Dashboard (with Home icon)
   - User Management (with Users icon)
   - System Activity (with Activity icon)
   - Alerts & Issues (with AlertCircle icon + badge)
   - Audit Logs (with FileText icon)
   - Settings (with Settings icon)

4. Click each navigation item

### Expected Results:
- ✅ All navigation items are visible
- ✅ Active route is highlighted
- ✅ Icons are properly displayed
- ✅ Badge shows on "Alerts & Issues" with count
- ✅ Navigation works smoothly without errors
- ✅ Sidebar is responsive on mobile

---

## Test 7: Real-Time Stats Updates

### Steps:
1. Keep `/admin/dashboard` open
2. In another tab, perform actions:
   - Create a new user
   - Create a new project
   - Create a new RFI
   - Send a message

3. Return to admin dashboard
4. Observe the Dashboard Overview Widget

### Expected Results:
- ✅ Stats update within 30 seconds
- ✅ Real-time subscriptions trigger immediate updates for:
  - User creation → Total Users increases
  - Project creation → Total Projects increases
  - Alert creation → Critical Alerts count updates
- ✅ No errors in console

---

## Test 8: Performance & Error Handling

### Steps:
1. Open browser DevTools → Network tab
2. Navigate to `/admin/dashboard`
3. Observe network requests
4. Check for:
   - Multiple unnecessary API calls
   - Failed requests
   - Slow queries (>2 seconds)

5. Disconnect internet temporarily
6. Reconnect and observe behavior

### Expected Results:
- ✅ Initial load completes in < 3 seconds
- ✅ No duplicate API calls
- ✅ Graceful error handling when offline
- ✅ Auto-reconnection works when back online
- ✅ Loading states shown during data fetch

---

## Test 9: Security & Permissions

### Steps:
1. Log out and log in as non-admin user
2. Try to access `/admin/dashboard`
3. Try to access admin API endpoints directly

### Expected Results:
- ✅ Non-admin users redirected to login or dashboard
- ✅ API calls return 403 Forbidden for non-admins
- ✅ Admin routes protected by authentication
- ✅ RLS policies prevent unauthorized data access

### Verify RLS:
```sql
-- Should only return data if user has system_admin role
SELECT * FROM admin_activity_log LIMIT 5;
SELECT * FROM admin_alerts LIMIT 5;
```

---

## Test 10: Complete Workflow Test

### Full Scenario:
1. **Login as admin** → Navigate to dashboard
2. **Observe stats** → All metrics load correctly
3. **Create alert via SQL** → Notification appears
4. **Check sidebar badge** → Count increases
5. **Resolve alert** → Badge count decreases
6. **Perform admin action** → Activity logged
7. **Check audit logs** → Action appears in logs
8. **Navigate between pages** → No errors, smooth transitions

---

## Cleanup After Testing

```sql
-- Remove test alerts
DELETE FROM admin_alerts WHERE alert_type LIKE 'test_%';

-- Remove test activity logs
DELETE FROM admin_activity_log WHERE resource_id LIKE 'test-%';
```

---

## Common Issues & Troubleshooting

### Issue: Notifications not appearing
- Check browser console for errors
- Verify Supabase connection
- Ensure real-time is enabled for `admin_alerts` table
- Check that user has notifications enabled in browser

### Issue: Badge not updating
- Verify subscription is active: Check DevTools → Network → WS (WebSocket)
- Check RLS policies allow reading `admin_alerts`
- Ensure table has realtime enabled

### Issue: Stats not loading
- Check if `get_system_health()` RPC function exists
- Verify function has correct permissions
- Check for SQL errors in browser console

### Issue: Activity logs not created
- Verify user is authenticated
- Check `admin_activity_log` table exists
- Ensure RLS policies allow INSERT for admin users

---

## Success Criteria

All tests should pass with:
- ✅ Zero console errors
- ✅ Real-time updates working within 2 seconds
- ✅ All notifications displayed correctly
- ✅ All activity properly logged
- ✅ Sidebar navigation functional
- ✅ Stats accurate and updating
- ✅ Security policies enforced

---

## Next Steps After Testing

If all tests pass:
1. Document any edge cases found
2. Add automated E2E tests using Playwright/Cypress
3. Monitor production metrics
4. Set up alerts for admin dashboard errors
5. Continue with Phase 4 enhancements

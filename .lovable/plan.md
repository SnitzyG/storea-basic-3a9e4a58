

# Plan: 10x Demo Data Expansion + Fix Broken Calendar, Messages, Financials, Tenders

## Problem Summary

Several critical issues prevent pages from displaying data:

1. **Calendar is broken**: The `useCalendarEvents` hook queries `start_datetime` but the localDB stores events with `start_time`/`end_time` fields -- field name mismatch means zero events show up.

2. **Messages show nothing**: The `useMessages` hook uses `.contains('participants', [user.id])` to filter threads, but the mock threads don't have a `participants` field -- they only have `created_by`. The messages also lack `project_id` on each message row.

3. **Financials are empty**: The `useFinancials` hook queries 10 tables (`project_budgets`, `budget_categories`, `project_invoices`, `project_payments`, `change_orders`, `cashflow_items`, `client_contributions`, `progress_claims`, `line_item_budgets`, `payment_stages`). Several of these tables don't exist in the localDB store at all (`budget_categories`, `project_payments`, `change_orders`, `cashflow_items`, `client_contributions`, `payment_stages`).

4. **Tenders don't show comparison data**: The Tenders page has a "Compare Quotes" tab that needs multiple bids with line items filled in. Currently `tender_bid_line_items` is empty.

5. **Console error**: `supabase.from(...).update(...).eq(...).in is not a function` from `useTabNotifications.ts` -- the `update()` chain doesn't return `.in()` method.

6. **Insufficient volume**: Only 3-6 entries per table. Need 10x more data everywhere.

## What Will Change

### File 1: `src/services/localDB.ts`

**Fix calendar event field names:**
- Change `start_time` to `start_datetime` and `end_time` to `end_datetime` on all calendar events
- Add `status`, `priority`, `is_meeting`, `category`, `updated_at` fields to match `CalendarEvent` interface

**Fix message thread structure:**
- Add `participants` array field to all `message_threads` entries (the field `useMessages` uses to filter)
- Add `project_id` field to all `messages` entries
- Add `title` field alias (threads use `title` in some places, `subject` in others)

**Add missing financial tables to the store:**
- `budget_categories` (5+ entries per project)
- `project_payments` (5+ entries)
- `change_orders` (4+ entries)
- `cashflow_items` (8+ entries)
- `client_contributions` (4+ entries)
- `payment_stages` (6 milestone stages)

**Add these table names to `TableName` union type.**

**Massively expand all existing data (10x):**

- **Profiles**: 4 to 8 users (add Mike Electrician, Lisa Plumber, David Surveyor, Anna Interior Designer)
- **Companies**: 3 to 6 (add Spark Electrical, FlowRight Plumbing, DesignStudio Interior)
- **Projects**: 3 to 5 (add "Heritage Hotel Restoration" and "Coastal Medical Centre")
- **Project Users**: 8 to 20+
- **RFIs**: 6 to 20+ (across all projects, all statuses, various categories)
- **Document Groups**: 8 to 25+ (all categories: Architectural, Structural, Survey, Services, Landscape, Permit, Specifications, Schedules)
- **Document Revisions**: 8 to 25+ (matching document groups, with superseded revisions)
- **Message Threads**: 3 to 10+ (across projects)
- **Messages**: 9 to 40+ (realistic conversations in each thread)
- **Tenders**: 3 to 8+ (all statuses: draft, open, closed, awarded, cancelled)
- **Tender Bids**: 3 to 12+ (multiple bids per tender for comparison)
- **Tender Bid Line Items**: 0 to 20+ (filled in per bid for comparison view)
- **Tender Line Items**: 3 to 15+
- **Calendar Events**: 6 to 25+ (spread across past, present, future dates)
- **Todos**: 6 to 15+
- **Activity Log**: 10 to 30+
- **Notifications**: 5 to 15+
- **Financial Data**:
  - Project Budgets: 1 to 3+ (one per project with budgets)
  - Project Invoices: 3 to 10+
  - Line Item Budgets: 5 to 15+
  - Progress Claims: 1 to 5+
  - Variations: 2 to 6+
  - Payment Schedule Stages: 3 to 6 full stages
  - Budget Categories: 0 to 8+
  - Project Payments: 0 to 6+
  - Change Orders: 0 to 5+
  - Cashflow Items: 0 to 10+
  - Client Contributions: 0 to 5+

**Fix `update()` method chain to support `.in()` on the returned object.**

### File 2: `src/integrations/supabase/client.ts`

No changes needed -- client already has all required mock methods.

## Technical Details

### Calendar Fix
```
// BEFORE (broken - wrong field names):
{ start_time: ..., end_time: ... }

// AFTER (matches CalendarEvent interface):  
{ start_datetime: ..., end_datetime: ..., status: 'scheduled', priority: 'medium', is_meeting: true, category: 'meeting' }
```

### Messages Fix
```
// BEFORE (missing participants):
{ id: 'thread-1', project_id: 'proj-1', subject: 'Design Review', created_by: userId }

// AFTER (includes participants array for .contains() filter):
{ id: 'thread-1', project_id: 'proj-1', title: 'Design Review', subject: 'Design Review', participants: [userId, sarahId, jamesId], created_by: userId }
```

### Financial Tables Fix
Add 6 new empty table registrations to `TableName` and seed them with realistic Australian construction project financial data.

### Update Method Chain Fix
The `update()` method currently returns `{ eq, select, then }`. Add `.in()` to the returned object:
```
update(updates) {
  return {
    eq: ...,
    in: (col, vals) => { self.in(col, vals); return self.update(updates); },
    select: ...,
    then: ...
  };
}
```

## Expected Result After Changes

Every page will display rich, realistic data:
- **Dashboard**: 30+ activities, 15+ todos, calendar widget with events, open RFIs count
- **Calendar**: 25+ events spread across past/present/future with meetings, deadlines, inspections
- **Messages**: 10+ threads with 40+ messages, team members visible
- **RFIs**: 20+ RFIs across all statuses with responses and activity trails
- **Documents**: 25+ documents across all categories with revision history
- **Tenders**: 8+ tenders with 12+ bids, comparison view populated with line items
- **Financials**: Full budget breakdown, invoices, payments, cashflow, progress claims, variations
- **Projects**: 5 projects with full team rosters
- **Notifications**: 15+ notifications of various types



# Plan: Implement Comprehensive Demo Data Throughout Application

## Problem
The application uses a local in-memory database (`localDB.ts`) that currently seeds only minimal data:
- 1 profile, 2 projects, 2 project_users, 1 activity log entry, 1 todo
- Empty arrays for: calendar_events, documents, messages, message_threads, message_participants, tenders, tender_packages, tender_bids, companies
- Missing tables entirely: rfis, rfi_activities, document_groups, document_revisions, document_shares, document_events, notifications, invitations, tender_access, project_budgets, project_invoices, line_item_budgets, progress_claims, variations, user_roles, user_sessions, admin_alerts

This means every page except Dashboard (partially) and Projects shows empty states with no demo data.

## Solution Overview
Expand `localDB.ts` with rich, realistic demo data across ALL tables so every page in the application displays meaningful content. Also fix the missing `functions` property and `upsert`/`resetPasswordForEmail` methods on the mock client, and add missing table registrations to the local database.

## What Each Page Will Show After Changes

| Page | Current State | After Changes |
|------|--------------|---------------|
| Dashboard | Partial (1 activity, 1 todo) | 8+ activities, 6+ todos, calendar preview, open RFIs |
| Projects | 2 projects (minimal) | 3 projects with full details, team members, stages |
| Documents | Empty | 8+ documents across categories (Architectural, Structural, etc.) |
| Messages | Empty | 3+ threads with conversation history |
| RFIs | Empty | 6+ RFIs across statuses (outstanding, answered, closed, draft) |
| Tenders | Empty | 3+ tenders (draft, open, awarded) with bids |
| Calendar | Empty | 6+ events (meetings, deadlines, inspections) |
| Financials | Empty/errors | Budget data, invoices, payment schedules |
| Notifications | Empty | 5+ notifications |

## Technical Implementation

### Step 1: Add Missing Tables to LocalDB Type Union
Add these table names to the `TableName` type:
- `rfis`, `rfi_activities`, `rfi_collaboration_comments`
- `document_groups`, `document_revisions`, `document_shares`, `document_events`
- `notifications`, `invitations`
- `tender_access`, `tender_line_items`, `tender_bid_line_items`
- `project_budgets`, `project_invoices`
- `line_item_budgets`, `progress_claims`, `variations`
- `user_roles`, `user_sessions`, `admin_alerts`

### Step 2: Add `upsert` Method to LocalQueryBuilder
The `ProfileSetupWizard` and `markMessageAsRead` functions call `.upsert()` which doesn't exist on the query builder. Add this method.

### Step 3: Add Missing Mock Client Properties
Add to `supabase` mock in `client.ts`:
- `auth.resetPasswordForEmail` method
- `auth.admin` object with `listUsers`, `updateUserById`, `deleteUser`
- `functions.invoke` method
- `storage.from().remove` method

### Step 4: Seed Rich Demo Data
Create comprehensive seed data in `localDB.ts`:

**Profiles (4 users)**:
- Richard Architect (architect) - current user
- Sarah Builder (builder)
- James Contractor (contractor)
- Emma Client (homeowner)

**Companies (3)**:
- STOREA Architecture, BuildRight Construction, HomeVision Contracting

**Projects (3 - with full details)**:
- Luxury Villa Renovation (active, Construction Documentation)
- City Apartment Complex (active, Concept)
- Suburban Family Home (completed)

**Project Users (8 - multiple users per project)**

**RFIs (6)**:
- 2 outstanding, 1 answered, 1 closed, 1 draft, 1 overdue
- With proper raised_by/assigned_to profiles, subjects, questions

**Documents / Document Groups (8)**:
- Architectural Plans Rev 2, Structural Engineering Report, Site Survey, Electrical Layout, Plumbing Layout, Landscape Design, Building Permit, Project Schedule

**Document Revisions (8 - one per document group)**

**Message Threads (3)**:
- "Design Review Discussion"
- "Site Progress Update"  
- "Material Selection"

**Messages (12+ across threads)**:
- Realistic construction project conversations
- With proper sender_ids matching team members

**Tenders (3)**:
- Kitchen Renovation Works (draft)
- Electrical Installation (open, with bids)
- Landscaping Package (awarded)

**Tender Bids (4)**:
- Multiple bids on open tenders

**Calendar Events (6)**:
- Site inspection, Design review meeting, Council submission deadline
- Client presentation, Progress meeting, Final walkthrough

**Todos (6)**:
- Review structural report, Submit DA documents, Order materials
- Schedule site meeting, Update project timeline, Review tender submissions

**Activity Log (10+)**:
- Mix of document uploads, RFI creates, message sends, project updates
- Spanning last 7 days

**Notifications (5)**:
- New RFI assigned, Document uploaded, Tender bid received, etc.

**Financial Data**:
- Project budgets, invoices, line item budgets for Luxury Villa project

### Step 5: Fix Build Errors
Fix the TypeScript build errors that reference missing mock client features:
- `src/api/admin.ts` - `auth.admin` doesn't exist
- `src/components/advanced/*` - `functions` doesn't exist
- `src/components/dashboard/InfoPanel.tsx` - `functions` doesn't exist
- `src/components/profile/*` - `resetPasswordForEmail`, storage `remove`
- `src/components/financials/*` - await on thenable issues
- Various `TS1320` errors from `await` on LocalQueryBuilder

### Step 6: Fix the `or()` Filter Method
The `or()` method on `LocalQueryBuilder` currently does nothing (returns `this`). Implement basic support for the `or()` filter pattern since many hooks use it.

## Files Modified

1. **`src/services/localDB.ts`** - Major expansion:
   - Add 20+ new table names to `TableName` union
   - Add `upsert()` method to `LocalQueryBuilder`
   - Implement `or()` filter method
   - Add `ilike()` method
   - Add `not()` method  
   - Add `match()` method
   - Expand seed data from ~120 lines to ~600+ lines of realistic demo data

2. **`src/integrations/supabase/client.ts`** - Add missing mock features:
   - `auth.admin` object
   - `auth.resetPasswordForEmail` method
   - `functions.invoke` method
   - Enhanced `storage.from().remove` method
   - `auth.updateUser` method

3. **`src/api/admin.ts`** - Fix references to `auth.admin` (will work after client.ts update)

4. **Various component files** - Minor fixes where `await` on LocalQueryBuilder causes TS1320 errors (the `then` method signature needs to match Promise interface)

## Impact
- Every page will display realistic, interconnected demo data
- Users can immediately see how the application works in practice
- Build errors from missing mock methods will be resolved
- The demo will showcase the full feature set of STOREA

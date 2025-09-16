-- Clean up all user-generated data for fresh start
-- This preserves the database schema but removes all user content
-- Handle foreign key constraints properly

-- Delete in order to respect foreign key constraints

-- 1. Delete activity logs
DELETE FROM activity_log;

-- 2. Delete calendar events
DELETE FROM calendar_events;

-- 3. Delete document-related data (handle foreign keys carefully)
DELETE FROM document_approvals;
DELETE FROM document_events;
DELETE FROM document_shares;
DELETE FROM document_transmittals;
DELETE FROM document_versions;

-- 4. Update document_groups to remove current_revision_id references before deleting revisions
UPDATE document_groups SET current_revision_id = NULL;

-- 5. Now delete document revisions and groups
DELETE FROM document_revisions;
DELETE FROM document_groups;
DELETE FROM documents;
DELETE FROM document_status_options;
DELETE FROM document_types;

-- 6. Delete RFI-related data
DELETE FROM rfi_activities;
DELETE FROM rfi_collaboration_comments;
DELETE FROM rfi_collaborators;
DELETE FROM rfi_email_delivery;
DELETE FROM rfi_workflow_transitions;
DELETE FROM rfis;
DELETE FROM rfi_templates;

-- 7. Delete tender-related data
DELETE FROM tender_bids;
DELETE FROM tender_invitations;
DELETE FROM tenders;

-- 8. Delete messages and threads
DELETE FROM message_participants;
DELETE FROM messages;
DELETE FROM message_threads;

-- 9. Delete notifications
DELETE FROM notifications;

-- 10. Delete invitations
DELETE FROM invitations;

-- 11. Delete project users and projects
DELETE FROM project_users;
DELETE FROM projects;

-- 12. Delete user profiles (but keep auth.users intact as it's managed by Supabase Auth)
DELETE FROM profiles;

-- 13. Delete companies
DELETE FROM companies;
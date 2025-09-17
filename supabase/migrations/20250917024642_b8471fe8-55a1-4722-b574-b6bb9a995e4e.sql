-- Complete user data wipe for clean test environment (fixed foreign key order)
-- This removes ALL user data from the system

-- Step 1: Clear foreign key references first
UPDATE document_groups SET current_revision_id = NULL;

-- Step 2: Clear all user-generated content tables (respecting foreign key dependencies)

-- Clear activity logs
DELETE FROM activity_log;

-- Clear calendar events
DELETE FROM calendar_events;

-- Clear document-related tables
DELETE FROM document_approvals;
DELETE FROM document_events;
DELETE FROM document_shares;
DELETE FROM document_transmittals;
DELETE FROM document_revisions;
DELETE FROM document_groups;
DELETE FROM document_versions;
DELETE FROM document_status_options;
DELETE FROM document_types;
DELETE FROM documents;

-- Clear RFI-related tables
DELETE FROM rfi_activities;
DELETE FROM rfi_collaboration_comments;
DELETE FROM rfi_collaborators;
DELETE FROM rfi_email_delivery;
DELETE FROM rfi_workflow_transitions;
DELETE FROM rfi_templates;
DELETE FROM rfis;

-- Clear message-related tables
DELETE FROM message_participants;
DELETE FROM messages;
DELETE FROM message_threads;

-- Clear project-related tables
DELETE FROM project_join_requests;
DELETE FROM project_users;
DELETE FROM invitations;
DELETE FROM projects;

-- Clear notifications
DELETE FROM notifications;

-- Clear user profiles
DELETE FROM profiles;

-- Clear companies (if no system companies)
DELETE FROM companies;

-- Step 3: Clear storage buckets
-- Remove all files from documents bucket
DELETE FROM storage.objects WHERE bucket_id = 'documents';

-- Step 4: Clear auth users (this will cascade to remove sessions, etc.)
-- Note: This removes ALL users including admins - be careful!
DELETE FROM auth.users;
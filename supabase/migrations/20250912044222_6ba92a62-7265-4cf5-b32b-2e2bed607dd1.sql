-- Step 2: Safe Database Consolidation Migration
-- Remove unused project_team_members table (empty table with no code dependencies)

-- Verify table is empty before dropping (safety check)
DO $$
DECLARE
    record_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO record_count FROM project_team_members;
    
    IF record_count > 0 THEN
        RAISE EXCEPTION 'project_team_members table is not empty (%)', record_count;
    END IF;
    
    RAISE NOTICE 'Verified: project_team_members table is empty, safe to drop';
END $$;

-- Drop the unused table
DROP TABLE IF EXISTS project_team_members;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: project_team_members table removed successfully';
END $$;
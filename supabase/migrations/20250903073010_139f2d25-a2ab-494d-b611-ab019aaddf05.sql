-- Fix the function to resolve column ambiguity
CREATE OR REPLACE FUNCTION public.link_pending_users_to_projects(user_email text, target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    project_record record;
    timeline_data jsonb;
    pending_collaborators jsonb;
    updated_collaborators jsonb;
BEGIN
    -- Link pending homeowners
    FOR project_record IN 
        SELECT id, timeline 
        FROM projects 
        WHERE timeline->'pending_homeowner'->>'email' = user_email
    LOOP
        -- Insert into project_users
        INSERT INTO project_users (project_id, user_id, role, invited_by, joined_at)
        VALUES (project_record.id, target_user_id, 'homeowner', null, now())
        ON CONFLICT (project_id, user_id) DO NOTHING;
        
        -- Remove from pending_homeowner
        timeline_data := project_record.timeline;
        timeline_data := timeline_data - 'pending_homeowner';
        
        UPDATE projects 
        SET timeline = timeline_data 
        WHERE id = project_record.id;
    END LOOP;
    
    -- Link pending collaborators
    FOR project_record IN 
        SELECT id, timeline 
        FROM projects 
        WHERE timeline->'pending_collaborators' IS NOT NULL
    LOOP
        pending_collaborators := project_record.timeline->'pending_collaborators';
        
        -- Check if user email is in pending collaborators
        IF pending_collaborators IS NOT NULL THEN
            FOR i IN 0..jsonb_array_length(pending_collaborators) - 1 LOOP
                IF pending_collaborators->i->>'email' = user_email THEN
                    -- Insert into project_users with the collaborator's role
                    INSERT INTO project_users (project_id, user_id, role, invited_by, joined_at)
                    VALUES (
                        project_record.id, 
                        target_user_id, 
                        (pending_collaborators->i->>'role')::user_role, 
                        null, 
                        now()
                    )
                    ON CONFLICT (project_id, user_id) DO NOTHING;
                    
                    -- Remove this collaborator from pending list
                    updated_collaborators := '[]'::jsonb;
                    FOR j IN 0..jsonb_array_length(pending_collaborators) - 1 LOOP
                        IF j != i THEN
                            updated_collaborators := updated_collaborators || (pending_collaborators->j);
                        END IF;
                    END LOOP;
                    
                    -- Update timeline
                    timeline_data := project_record.timeline;
                    timeline_data := jsonb_set(timeline_data, '{pending_collaborators}', updated_collaborators);
                    
                    UPDATE projects 
                    SET timeline = timeline_data 
                    WHERE id = project_record.id;
                    
                    EXIT; -- Exit the inner loop once found
                END IF;
            END LOOP;
        END IF;
    END LOOP;
END;
$$;
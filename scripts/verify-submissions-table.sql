-- Verify the submissions table structure and show current schema
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

-- Check if the table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'submissions'
) as table_exists;

-- Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='submissions';

-- Show sample data if any exists
SELECT COUNT(*) as total_submissions FROM submissions;

-- Show recent submissions (if any)
SELECT 
    id,
    team_name,
    project_title,
    theme_id,
    status,
    created_at,
    CASE 
        WHEN user_id IS NOT NULL THEN 'Has user_id'
        ELSE 'No user_id'
    END as user_id_status
FROM submissions 
ORDER BY created_at DESC 
LIMIT 5;

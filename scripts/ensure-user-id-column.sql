-- Ensure user_id column exists and is properly configured
DO $$ 
BEGIN
    -- Check if user_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'submissions' 
        AND column_name = 'user_id'
    ) THEN
        -- Add user_id column
        ALTER TABLE submissions 
        ADD COLUMN user_id UUID;
        
        -- Add foreign key constraint
        ALTER TABLE submissions 
        ADD CONSTRAINT fk_submissions_user_id 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Add index for performance
        CREATE INDEX idx_submissions_user_id ON submissions(user_id);
        
        RAISE NOTICE 'Successfully added user_id column to submissions table';
    ELSE
        RAISE NOTICE 'user_id column already exists in submissions table';
        
        -- Ensure foreign key constraint exists
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'submissions' 
            AND constraint_name = 'fk_submissions_user_id'
        ) THEN
            ALTER TABLE submissions 
            ADD CONSTRAINT fk_submissions_user_id 
            FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
            
            RAISE NOTICE 'Added foreign key constraint for user_id';
        END IF;
        
        -- Ensure index exists
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_indexes 
            WHERE tablename = 'submissions' 
            AND indexname = 'idx_submissions_user_id'
        ) THEN
            CREATE INDEX idx_submissions_user_id ON submissions(user_id);
            RAISE NOTICE 'Added index for user_id column';
        END IF;
    END IF;
    
    -- Ensure team_name is nullable for individual participation
    ALTER TABLE submissions ALTER COLUMN team_name DROP NOT NULL;
    
    -- Set default value for team_name
    ALTER TABLE submissions ALTER COLUMN team_name SET DEFAULT 'Individual Participant';
    
    -- Update any null team_name values
    UPDATE submissions 
    SET team_name = COALESCE(team_name, 'Individual Participant')
    WHERE team_name IS NULL OR team_name = '';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred: %', SQLERRM;
END $$;

-- Show current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

-- Show foreign key constraints
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

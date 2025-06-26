-- Safely add user_id column to submissions table
-- This script checks if the column exists before adding it

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

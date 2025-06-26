-- Comprehensive fix for submissions table structure
-- This script ensures all required columns exist and are properly configured

-- First, let's check and add missing columns to submissions table
DO $$ 
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'user_id') THEN
        ALTER TABLE submissions ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        RAISE NOTICE 'Added user_id column to submissions table';
    ELSE
        RAISE NOTICE 'user_id column already exists in submissions table';
    END IF;

    -- Add team_members column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'team_members') THEN
        ALTER TABLE submissions ADD COLUMN team_members TEXT;
        RAISE NOTICE 'Added team_members column to submissions table';
    ELSE
        RAISE NOTICE 'team_members column already exists in submissions table';
    END IF;
END $$;

-- Make team_name nullable and add default value
ALTER TABLE submissions ALTER COLUMN team_name DROP NOT NULL;
ALTER TABLE submissions ALTER COLUMN team_name SET DEFAULT 'Individual Participant';

-- Update any existing null team_name values
UPDATE submissions 
SET team_name = COALESCE(team_name, 'Individual Participant')
WHERE team_name IS NULL;

-- Ensure proper data types and constraints
ALTER TABLE submissions ALTER COLUMN project_title TYPE VARCHAR(255);
ALTER TABLE submissions ALTER COLUMN project_description TYPE TEXT;
ALTER TABLE submissions ALTER COLUMN application_url TYPE TEXT;
ALTER TABLE submissions ALTER COLUMN gitlab_url TYPE TEXT;
ALTER TABLE submissions ALTER COLUMN pdf_file_name TYPE VARCHAR(255);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_theme_id ON submissions(theme_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at);

-- Add comments for documentation
COMMENT ON COLUMN submissions.user_id IS 'Reference to the user who created this submission';
COMMENT ON COLUMN submissions.team_name IS 'Team name or individual participant name (nullable for individual participation)';
COMMENT ON COLUMN submissions.team_members IS 'Team member names (optional for individual participation)';
COMMENT ON COLUMN submissions.project_title IS 'Title of the submitted project';
COMMENT ON COLUMN submissions.project_description IS 'Description of the project and approach';
COMMENT ON COLUMN submissions.theme_id IS 'Reference to the hackathon theme';
COMMENT ON COLUMN submissions.application_url IS 'URL to the deployed application';
COMMENT ON COLUMN submissions.gitlab_url IS 'URL to the GitLab repository';
COMMENT ON COLUMN submissions.pdf_file_name IS 'Name of the uploaded PDF presentation file';
COMMENT ON COLUMN submissions.score IS 'Score assigned by judges (0-100)';
COMMENT ON COLUMN submissions.feedback IS 'Feedback from judges';
COMMENT ON COLUMN submissions.status IS 'Current status of the submission';

-- Show the current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

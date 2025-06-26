-- Fix the submissions table to handle individual participation
-- Make team_name nullable and add default values for individual participants

-- First, let's make team_name nullable since this is individual participation
ALTER TABLE submissions ALTER COLUMN team_name DROP NOT NULL;

-- Add a default value for team_name when it's not provided
ALTER TABLE submissions ALTER COLUMN team_name SET DEFAULT 'Individual Participant';

-- Update existing submissions that might have null team_name
UPDATE submissions 
SET team_name = COALESCE(team_name, 'Individual Participant')
WHERE team_name IS NULL;

-- Add team_members column if it doesn't exist and make it nullable
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'team_members') THEN
        ALTER TABLE submissions ADD COLUMN team_members TEXT;
    END IF;
END $$;

-- Update the submissions table to better reflect individual participation
COMMENT ON COLUMN submissions.team_name IS 'Team name or individual participant name';
COMMENT ON COLUMN submissions.team_members IS 'Team member names (optional for individual participation)';

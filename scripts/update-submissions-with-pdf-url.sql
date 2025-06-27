-- Add pdf_url column to submissions table to store the public URL
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add pdf_path column to store the storage path for deletion
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS pdf_path TEXT;

-- Update existing submissions to have null values for new columns
UPDATE submissions 
SET pdf_url = NULL, pdf_path = NULL 
WHERE pdf_url IS NULL AND pdf_path IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_submissions_pdf_url ON submissions(pdf_url);

-- Show updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'submissions' 
ORDER BY ordinal_position;

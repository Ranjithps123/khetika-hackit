-- Create the storage bucket for hackathon PDFs
-- This should be run by a database admin or through the Supabase dashboard

-- First, ensure the storage schema exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Create the bucket (this may need to be done through Supabase dashboard)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hackathon-pdfs',
  'hackathon-pdfs', 
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'hackathon-pdfs';

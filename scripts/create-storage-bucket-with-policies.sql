-- Create storage bucket and policies for hackathon PDFs
-- This script should be run by a database admin

-- First, ensure the storage schema exists
CREATE SCHEMA IF NOT EXISTS storage;

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hackathon-pdfs',
  'hackathon-pdfs', 
  true,
  10485760, -- 10MB limit
  ARRAY['application/pdf']
) ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads to hackathon-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to hackathon-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to hackathon-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from hackathon-pdfs" ON storage.objects;

-- Create policies for the hackathon-pdfs bucket

-- 1. Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to hackathon-pdfs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'hackathon-pdfs' AND 
  auth.role() = 'authenticated'
);

-- 2. Allow public read access to files
CREATE POLICY "Allow public read access to hackathon-pdfs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'hackathon-pdfs'
);

-- 3. Allow authenticated users to update files
CREATE POLICY "Allow authenticated updates to hackathon-pdfs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'hackathon-pdfs' AND 
  auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'hackathon-pdfs' AND 
  auth.role() = 'authenticated'
);

-- 4. Allow authenticated users to delete files
CREATE POLICY "Allow authenticated deletes from hackathon-pdfs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'hackathon-pdfs' AND 
  auth.role() = 'authenticated'
);

-- Verify the setup
SELECT 'Bucket created/updated' as status, id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id = 'hackathon-pdfs';

SELECT 'Policies created' as status, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage' 
AND policyname LIKE '%hackathon-pdfs%';

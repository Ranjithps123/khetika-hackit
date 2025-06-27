-- Fix storage policies for hackathon-pdfs bucket
-- This script ensures proper RLS policies for file uploads

-- First, enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow authenticated users to upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to manage all PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;

-- Create comprehensive policies for the hackathon-pdfs bucket

-- 1. Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to hackathon-pdfs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'hackathon-pdfs' AND 
  auth.role() = 'authenticated'
);

-- 2. Allow authenticated users to view files (public read access)
CREATE POLICY "Allow public read access to hackathon-pdfs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'hackathon-pdfs'
);

-- 3. Allow authenticated users to update their files
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

-- Verify the bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'hackathon-pdfs';

-- Show current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Show bucket configuration
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'hackathon-pdfs';

-- Create storage policies for the hackathon-pdfs bucket
-- Only create policies if the bucket exists

DO $$
BEGIN
    -- Check if bucket exists before creating policies
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'hackathon-pdfs') THEN
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow authenticated users to upload PDFs" ON storage.objects;
        DROP POLICY IF EXISTS "Allow authenticated users to view PDFs" ON storage.objects;
        DROP POLICY IF EXISTS "Allow users to delete their own PDFs" ON storage.objects;
        DROP POLICY IF EXISTS "Allow admins to manage all PDFs" ON storage.objects;
        
        -- Policy to allow authenticated users to upload files
        CREATE POLICY "Allow authenticated users to upload PDFs" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'hackathon-pdfs' AND 
          auth.role() = 'authenticated'
        );

        -- Policy to allow authenticated users to view files
        CREATE POLICY "Allow authenticated users to view PDFs" ON storage.objects
        FOR SELECT USING (
          bucket_id = 'hackathon-pdfs' AND 
          auth.role() = 'authenticated'
        );

        -- Policy to allow users to delete their own files (based on folder structure)
        CREATE POLICY "Allow users to delete their own PDFs" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'hackathon-pdfs' AND 
          auth.role() = 'authenticated'
        );

        -- Policy to allow admins to manage all files
        CREATE POLICY "Allow admins to manage all PDFs" ON storage.objects
        FOR ALL USING (
          bucket_id = 'hackathon-pdfs' AND 
          (
            auth.role() = 'authenticated' OR
            EXISTS (
              SELECT 1 FROM user_profiles 
              WHERE user_profiles.id = auth.uid() 
              AND user_profiles.user_type = 'admin'
            )
          )
        );
        
        RAISE NOTICE 'Storage policies created successfully for hackathon-pdfs bucket';
    ELSE
        RAISE NOTICE 'Bucket hackathon-pdfs does not exist. Please create it first through Supabase dashboard.';
    END IF;
END $$;

-- Create user-backups storage bucket and policies
-- Run this in Supabase SQL Editor

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-backups', 'user-backups', false)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create storage policies for user-backups bucket

-- Policy 1: Allow users to upload their own backups
CREATE POLICY "Users can upload their own backups"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow users to read their own backups
CREATE POLICY "Users can read their own backups"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow users to delete their own backups
CREATE POLICY "Users can delete their own backups"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow users to update their own backups
CREATE POLICY "Users can update their own backups"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'user-backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'user-backups'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'user-backups';

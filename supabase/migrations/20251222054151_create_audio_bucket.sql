-- Create audio bucket for storing audio files
-- Based on design.md F-010 and Issue 4 requirements

-- ========================================
-- 1. Create audio bucket
-- ========================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', false);

-- ========================================
-- 2. Storage RLS policies for audio bucket
-- ========================================

-- Read policy: authenticated users can read files in their department
CREATE POLICY "Users can read audio files in their department"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'audio'
    AND auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE department_id = split_part(storage.objects.name, '/', 1)::uuid
    )
  );

-- Write policy: authenticated users can upload files to their own minutes
CREATE POLICY "Users can upload audio files for their own minutes"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'audio'
    AND auth.uid() IN (
      SELECT owner_id FROM public.minutes
      WHERE id = split_part(storage.objects.name, '/', 2)::uuid
    )
  );

-- Delete policy: authenticated users can delete files from their own minutes
CREATE POLICY "Users can delete audio files from their own minutes"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'audio'
    AND auth.uid() IN (
      SELECT owner_id FROM public.minutes
      WHERE id = split_part(storage.objects.name, '/', 2)::uuid
    )
  );

-- ========================================
-- 3. Storage path pattern
-- ========================================
-- Expected path: {department_id}/{minute_id}/{timestamp}_{filename}
-- Example: 123e4567-e89b-12d3-a456-426614174000/456e7890-e12b-34d5-a678-426614174111/1703001234567_recording.m4a
-- This pattern ensures:
--   - Department isolation (via RLS on department_id)
--   - Minute ownership validation (via RLS on owner_id)
--   - File uniqueness (via timestamp prefix)

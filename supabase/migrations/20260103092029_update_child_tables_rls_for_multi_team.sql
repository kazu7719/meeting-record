-- Update RLS policies for action_items, audio_files, and ai_jobs
-- to support multi-team functionality
--
-- Issue 33: Fix action items not displaying after page reload
-- Root cause: RLS policies were still using old single-team logic
-- with profiles.department_id instead of user_departments table

-- ========================================
-- 1. action_items RLS update
-- ========================================

-- DROP old policy that references profiles.department_id
DROP POLICY IF EXISTS "Users can read action_items in their department" ON public.action_items;

-- CREATE new policy that checks user_departments
CREATE POLICY "Users can read action_items in their departments"
  ON public.action_items
  FOR SELECT
  USING (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE department_id IN (
        SELECT department_id FROM public.user_departments
        WHERE user_id = auth.uid()
      )
    )
  );

-- ========================================
-- 2. audio_files RLS update
-- ========================================

-- DROP old policy
DROP POLICY IF EXISTS "Users can read audio_files in their department" ON public.audio_files;

-- CREATE new policy
CREATE POLICY "Users can read audio_files in their departments"
  ON public.audio_files
  FOR SELECT
  USING (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE department_id IN (
        SELECT department_id FROM public.user_departments
        WHERE user_id = auth.uid()
      )
    )
  );

-- ========================================
-- 3. ai_jobs RLS update
-- ========================================

-- DROP old policy
DROP POLICY IF EXISTS "Users can read ai_jobs in their department" ON public.ai_jobs;

-- CREATE new policy
CREATE POLICY "Users can read ai_jobs in their departments"
  ON public.ai_jobs
  FOR SELECT
  USING (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE department_id IN (
        SELECT department_id FROM public.user_departments
        WHERE user_id = auth.uid()
      )
    )
  );

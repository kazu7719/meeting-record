-- Add RLS policies for minutes, action_items, audio_files, ai_jobs
-- Based on design.md 5.1 and Issue 2 requirements

-- ========================================
-- 1. minutes テーブル RLS
-- ========================================

-- RLS 有効化
ALTER TABLE public.minutes ENABLE ROW LEVEL SECURITY;

-- SELECT: 同じ department_id を持つユーザーのみ閲覧可能
CREATE POLICY "Users can read minutes in their department"
  ON public.minutes
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.profiles
      WHERE department_id = minutes.department_id
    )
  );

-- INSERT: owner_id=auth.uid() かつ department_id は profiles から導出（偽装防止）
CREATE POLICY "Users can insert minutes in their department"
  ON public.minutes
  FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND department_id = (
      SELECT department_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- UPDATE: 作成者のみ編集可能
CREATE POLICY "Users can update their own minutes"
  ON public.minutes
  FOR UPDATE
  USING (owner_id = auth.uid());

-- DELETE: 作成者のみ削除可能
CREATE POLICY "Users can delete their own minutes"
  ON public.minutes
  FOR DELETE
  USING (owner_id = auth.uid());

-- ========================================
-- 2. action_items テーブル RLS
-- ========================================

-- RLS 有効化
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;

-- SELECT: 親 minutes が自部門のもののみ
CREATE POLICY "Users can read action_items in their department"
  ON public.action_items
  FOR SELECT
  USING (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE department_id = (
        SELECT department_id FROM public.profiles
        WHERE id = auth.uid()
      )
    )
  );

-- INSERT: 親 minutes が owner_id=auth.uid() のもののみ
CREATE POLICY "Users can insert action_items for their own minutes"
  ON public.action_items
  FOR INSERT
  WITH CHECK (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: 親 minutes が owner_id=auth.uid() のもののみ
CREATE POLICY "Users can update action_items for their own minutes"
  ON public.action_items
  FOR UPDATE
  USING (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE owner_id = auth.uid()
    )
  );

-- DELETE: 親 minutes が owner_id=auth.uid() のもののみ
CREATE POLICY "Users can delete action_items for their own minutes"
  ON public.action_items
  FOR DELETE
  USING (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE owner_id = auth.uid()
    )
  );

-- ========================================
-- 3. audio_files テーブル RLS
-- ========================================

-- RLS 有効化
ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;

-- SELECT: 親 minutes が自部門のもののみ
CREATE POLICY "Users can read audio_files in their department"
  ON public.audio_files
  FOR SELECT
  USING (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE department_id = (
        SELECT department_id FROM public.profiles
        WHERE id = auth.uid()
      )
    )
  );

-- INSERT: 親 minutes が owner_id=auth.uid() のもののみ
CREATE POLICY "Users can insert audio_files for their own minutes"
  ON public.audio_files
  FOR INSERT
  WITH CHECK (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: 親 minutes が owner_id=auth.uid() のもののみ
CREATE POLICY "Users can update audio_files for their own minutes"
  ON public.audio_files
  FOR UPDATE
  USING (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE owner_id = auth.uid()
    )
  );

-- DELETE: 親 minutes が owner_id=auth.uid() のもののみ
CREATE POLICY "Users can delete audio_files for their own minutes"
  ON public.audio_files
  FOR DELETE
  USING (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE owner_id = auth.uid()
    )
  );

-- ========================================
-- 4. ai_jobs テーブル RLS
-- ========================================

-- RLS 有効化
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;

-- SELECT: 親 minutes が自部門のもののみ
CREATE POLICY "Users can read ai_jobs in their department"
  ON public.ai_jobs
  FOR SELECT
  USING (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE department_id = (
        SELECT department_id FROM public.profiles
        WHERE id = auth.uid()
      )
    )
  );

-- INSERT: 親 minutes が owner_id=auth.uid() のもののみ
CREATE POLICY "Users can insert ai_jobs for their own minutes"
  ON public.ai_jobs
  FOR INSERT
  WITH CHECK (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: 親 minutes が owner_id=auth.uid() のもののみ
CREATE POLICY "Users can update ai_jobs for their own minutes"
  ON public.ai_jobs
  FOR UPDATE
  USING (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE owner_id = auth.uid()
    )
  );

-- DELETE: 親 minutes が owner_id=auth.uid() のもののみ
CREATE POLICY "Users can delete ai_jobs for their own minutes"
  ON public.ai_jobs
  FOR DELETE
  USING (
    minute_id IN (
      SELECT id FROM public.minutes
      WHERE owner_id = auth.uid()
    )
  );

-- ========================================
-- 5. Storage (audio bucket) RLS
-- ========================================

-- Note: Storage policies are managed separately in Supabase Dashboard
-- or via Supabase CLI commands. The SQL policies for storage bucket would be:
--
-- Bucket: audio
-- Path pattern: {department_id}/{minute_id}/{filename}
--
-- Read policy:
--   authenticated users can read files in their department
--   WHERE department_id = (SELECT department_id FROM profiles WHERE id = auth.uid())
--
-- Write policy:
--   authenticated users can upload files to their own minutes
--   WHERE minute_id IN (SELECT id FROM minutes WHERE owner_id = auth.uid())
--
-- These will be configured when Storage is set up (Issue 4: 音声アップロード)

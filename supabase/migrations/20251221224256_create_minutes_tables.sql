-- Create minutes, action_items, audio_files, ai_jobs tables
-- Based on design.md 3.2

-- ========================================
-- 1. minutes（議事録）
-- ========================================
CREATE TABLE IF NOT EXISTS public.minutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department_id UUID NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  summary TEXT NULL,
  meeting_date DATE NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- raw_text 文字数制限（推奨：30,000文字）
ALTER TABLE public.minutes
  ADD CONSTRAINT check_raw_text_length CHECK (char_length(raw_text) <= 30000);

-- インデックス
CREATE INDEX idx_minutes_department_id ON public.minutes(department_id);
CREATE INDEX idx_minutes_owner_id ON public.minutes(owner_id);
CREATE INDEX idx_minutes_meeting_date ON public.minutes(meeting_date);

COMMENT ON TABLE public.minutes IS '議事録：会議1回=1件';
COMMENT ON COLUMN public.minutes.id IS '議事録ID（PK）';
COMMENT ON COLUMN public.minutes.title IS '会議名（一覧表示・識別用）';
COMMENT ON COLUMN public.minutes.department_id IS '部門ID（RLS境界）';
COMMENT ON COLUMN public.minutes.owner_id IS '作成者ID（編集/削除権限）';
COMMENT ON COLUMN public.minutes.raw_text IS '議事録全文（正データ、AI改変禁止）';
COMMENT ON COLUMN public.minutes.summary IS '要約（派生データ、再生成可能）';
COMMENT ON COLUMN public.minutes.meeting_date IS '会議日（不明ならNULL）';
COMMENT ON COLUMN public.minutes.created_at IS '作成日時（監査用）';
COMMENT ON COLUMN public.minutes.updated_at IS '更新日時（監査用）';

-- ========================================
-- 2. action_items（アクションプラン）
-- ========================================
CREATE TABLE IF NOT EXISTS public.action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minute_id UUID NOT NULL REFERENCES public.minutes(id) ON DELETE CASCADE,
  task_content TEXT NOT NULL,
  assignee_name TEXT NULL,
  due_at TIMESTAMPTZ NULL,
  note TEXT NULL,
  evidence TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_action_items_minute_id ON public.action_items(minute_id);
CREATE INDEX idx_action_items_due_at ON public.action_items(due_at);

COMMENT ON TABLE public.action_items IS 'アクションプラン：タスク行';
COMMENT ON COLUMN public.action_items.id IS 'アクションID（PK）';
COMMENT ON COLUMN public.action_items.minute_id IS '議事録ID（FK、CASCADE削除）';
COMMENT ON COLUMN public.action_items.task_content IS 'タスク内容（主要表示項目）';
COMMENT ON COLUMN public.action_items.assignee_name IS '担当者名（不明ならNULL、推測禁止）';
COMMENT ON COLUMN public.action_items.due_at IS '期限（不明ならNULL、推測禁止）';
COMMENT ON COLUMN public.action_items.note IS '補足（背景/手順/前提）';
COMMENT ON COLUMN public.action_items.evidence IS '根拠引用（raw_textからの引用、創作防止のため必須）';
COMMENT ON COLUMN public.action_items.created_at IS '作成日時（監査用）';

-- ========================================
-- 3. audio_files（音声ファイル）
-- ========================================
CREATE TABLE IF NOT EXISTS public.audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minute_id UUID NOT NULL REFERENCES public.minutes(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  duration INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_audio_files_minute_id ON public.audio_files(minute_id);

COMMENT ON TABLE public.audio_files IS '音声ファイルのメタ情報';
COMMENT ON COLUMN public.audio_files.id IS '音声ID（PK）';
COMMENT ON COLUMN public.audio_files.minute_id IS '議事録ID（FK、CASCADE削除）';
COMMENT ON COLUMN public.audio_files.file_path IS 'Supabase Storageのパス（{department_id}/{minute_id}/...）';
COMMENT ON COLUMN public.audio_files.mime_type IS 'MIMEタイプ（audio/mp4想定）';
COMMENT ON COLUMN public.audio_files.duration IS '再生時間（秒、不明ならNULL）';
COMMENT ON COLUMN public.audio_files.created_at IS '作成日時（監査用）';

-- ========================================
-- 4. ai_jobs（AI実行履歴）
-- ========================================
CREATE TABLE IF NOT EXISTS public.ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  minute_id UUID NOT NULL REFERENCES public.minutes(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('summary', 'action', 'qa')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_ai_jobs_minute_id ON public.ai_jobs(minute_id);
CREATE INDEX idx_ai_jobs_type_status ON public.ai_jobs(job_type, status);

COMMENT ON TABLE public.ai_jobs IS 'AI実行履歴';
COMMENT ON COLUMN public.ai_jobs.id IS 'ジョブID（PK）';
COMMENT ON COLUMN public.ai_jobs.minute_id IS '議事録ID（FK、CASCADE削除）';
COMMENT ON COLUMN public.ai_jobs.job_type IS '処理種別（summary/action/qa）';
COMMENT ON COLUMN public.ai_jobs.status IS '状態（pending/success/failed）';
COMMENT ON COLUMN public.ai_jobs.error_message IS 'エラー内容（失敗理由、内部向け）';
COMMENT ON COLUMN public.ai_jobs.created_at IS '作成日時（監査用）';

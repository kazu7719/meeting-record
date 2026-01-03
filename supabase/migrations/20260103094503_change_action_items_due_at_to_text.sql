-- Change action_items.due_at from TIMESTAMPTZ to TEXT
-- to support text-based deadlines like "明日まで", "今週金曜日まで"

-- Drop the existing index on due_at
DROP INDEX IF EXISTS public.idx_action_items_due_at;

-- Change the column type from TIMESTAMPTZ to TEXT
-- USING clause converts existing timestamp values to ISO format text
ALTER TABLE public.action_items
  ALTER COLUMN due_at TYPE TEXT
  USING CASE
    WHEN due_at IS NULL THEN NULL
    ELSE due_at::TEXT
  END;

-- Update the column comment
COMMENT ON COLUMN public.action_items.due_at IS '期限（テキスト形式、例: "明日まで", "今週金曜日まで"。不明ならNULL、推測禁止）';

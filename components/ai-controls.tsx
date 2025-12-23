'use client';

import { Button } from '@/components/ui/button';

/**
 * AIコントロールコンポーネント
 * Issue 7: AI要約機能のボタンエリア
 *
 * - AI実行ボタンの表示
 * - ボタンの有効化/無効化制御
 */

interface AiControlsProps {
  rawText: string;
  isOverLimit: boolean;
  isGeneratingSummary: boolean;
  onGenerateSummary: () => void;
  isExtractingActions: boolean;
  onExtractActions: () => void;
}

export function AiControls({
  rawText,
  isOverLimit,
  isGeneratingSummary,
  onGenerateSummary,
  isExtractingActions,
  onExtractActions,
}: AiControlsProps) {
  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
      <h3 className="text-lg font-semibold mb-3">AI機能</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        以下のボタンを押すとAI処理が実行されます（自動では実行されません）
      </p>
      <div className="flex flex-wrap gap-3">
        <Button
          variant="default"
          disabled={!rawText.trim() || isOverLimit || isGeneratingSummary}
          onClick={onGenerateSummary}
        >
          {isGeneratingSummary ? '生成中...' : '要約を生成'}
        </Button>
        <Button
          variant="default"
          disabled={!rawText.trim() || isOverLimit || isExtractingActions}
          onClick={onExtractActions}
        >
          {isExtractingActions ? '抽出中...' : 'アクションを抽出'}
        </Button>
        <Button variant="default" disabled={!rawText.trim() || isOverLimit}>
          質問する（QA）
        </Button>
      </div>
    </div>
  );
}

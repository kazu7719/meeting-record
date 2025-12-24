'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * AIコントロールコンポーネント
 * Issue 7, 8, 9: AI要約・アクション抽出・QA機能のボタンエリア
 *
 * - AI実行ボタンの表示
 * - ボタンの有効化/無効化制御
 * - QA質問入力欄
 */

interface AiControlsProps {
  rawText: string;
  isOverLimit: boolean;
  isGeneratingSummary: boolean;
  onGenerateSummary: () => void;
  isExtractingActions: boolean;
  onExtractActions: () => void;
  question: string;
  onQuestionChange: (value: string) => void;
  isExecutingQA: boolean;
  onExecuteQA: () => void;
}

export function AiControls({
  rawText,
  isOverLimit,
  isGeneratingSummary,
  onGenerateSummary,
  isExtractingActions,
  onExtractActions,
  question,
  onQuestionChange,
  isExecutingQA,
  onExecuteQA,
}: AiControlsProps) {
  const isQADisabled =
    !rawText.trim() ||
    isOverLimit ||
    !question.trim() ||
    isExecutingQA;

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
      <h3 className="text-lg font-semibold mb-3">AI機能</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        以下のボタンを押すとAI処理が実行されます（自動では実行されません）
      </p>
      <div className="flex flex-wrap gap-3 mb-4">
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
      </div>

      {/* QA機能 */}
      <div className="space-y-3">
        <div>
          <Label htmlFor="qa-question" className="text-sm font-medium">
            質問（QA）
          </Label>
          <Input
            id="qa-question"
            type="text"
            placeholder="例: 参加者は誰ですか？"
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            className="mt-1"
            maxLength={800}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            最大800文字
          </p>
        </div>
        <Button
          variant="default"
          disabled={isQADisabled}
          onClick={onExecuteQA}
        >
          {isExecutingQA ? '実行中...' : '質問する（QA）'}
        </Button>
      </div>
    </div>
  );
}

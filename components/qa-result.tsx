/**
 * QA結果表示コンポーネント
 * Issue 9: AI QA機能の結果表示エリア
 *
 * - QA結果（answer + evidence）またはエラーメッセージを表示
 * - 結果がない場合は何も表示しない
 */

import type { QAResult } from '@/app/actions/qa-answer';

interface QAResultProps {
  result: QAResult | null;
  error: string | null;
}

export function QAResultDisplay({ result, error }: QAResultProps) {
  if (!result && !error) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 border rounded-md">
      <h3 className="text-lg font-semibold mb-3">QA結果</h3>
      {error ? (
        <div
          className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
          role="alert"
        >
          {error}
        </div>
      ) : result ? (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              回答
            </h4>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {result.answer}
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              根拠
            </h4>
            <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md">
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                「{result.evidence}」
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

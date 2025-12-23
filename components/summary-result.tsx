/**
 * 要約結果表示コンポーネント
 * Issue 7: AI要約機能の結果表示エリア
 *
 * - 要約結果またはエラーメッセージを表示
 * - 結果がない場合は何も表示しない
 */

interface SummaryResultProps {
  summary: string | null;
  error: string | null;
}

export function SummaryResult({ summary, error }: SummaryResultProps) {
  if (!summary && !error) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 border rounded-md">
      <h3 className="text-lg font-semibold mb-3">要約結果</h3>
      {error ? (
        <div
          className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
          role="alert"
        >
          {error}
        </div>
      ) : (
        <div className="prose dark:prose-invert max-w-none">
          <pre className="whitespace-pre-wrap text-sm">{summary}</pre>
        </div>
      )}
    </div>
  );
}

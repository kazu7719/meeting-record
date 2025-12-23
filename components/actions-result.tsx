/**
 * アクション抽出結果表示コンポーネント
 * Issue 8: AIアクション抽出機能の結果表示エリア
 *
 * - アクション項目を表形式で表示
 * - evidence（根拠引用）を明示
 * - エラーメッセージを表示
 */

import type { ActionItem } from '@/app/actions/extract-actions';

interface ActionsResultProps {
  actions: ActionItem[] | null;
  error: string | null;
}

export function ActionsResult({ actions, error }: ActionsResultProps) {
  if (!actions && !error) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-white dark:bg-gray-800 border rounded-md">
      <h3 className="text-lg font-semibold mb-3">アクション抽出結果</h3>
      {error ? (
        <div
          className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
          role="alert"
        >
          {error}
        </div>
      ) : actions && actions.length > 0 ? (
        <div className="overflow-x-auto">
          <table
            className="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
            aria-label="抽出されたアクション項目一覧"
          >
            <caption className="sr-only">
              会議から抽出されたアクション項目の一覧（タスク内容、担当者、期限、補足、根拠引用を含む）
            </caption>
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  タスク内容
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  担当者
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  期限
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  補足
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  根拠引用
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {actions.map((action, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                    {action.task_content}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {action.assignee_name || '（未定）'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {action.due_at || '（未定）'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {action.note || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 italic">
                    「{action.evidence}」
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          アクション項目が抽出されませんでした。
        </p>
      )}
    </div>
  );
}

import { SaveButton } from './save-button';
import { Label } from '@/components/ui/label';

/**
 * ゲストトップ画面コンポーネント（Server Component）
 * Issue 1: 認証設計 - 最小限の実装
 *
 * - サンプル議事録エリア表示
 * - 保存ボタン（Client Component）
 */
export function GuestTop() {
  const sampleText =
    '# 開発進捗定例（サンプル）\n\n' +
    '## 日時\n2025-01-15 10:00-11:00\n\n' +
    '## 参加者\n田中、佐藤、鈴木\n\n' +
    '## 議題\n1. 前回アクションの確認\n2. 今週の進捗報告\n\n' +
    '## 決定事項\n- ログイン機能を今週中に実装する（担当：田中）\n' +
    '- UI/UXレビューを来週実施する（担当：佐藤）';

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="sample-meeting-area">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">サンプル議事録</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          サンプル議事録が入力されています。自由に編集できます。
        </p>
      </div>

      <div className="mb-6">
        <Label htmlFor="raw-text-input" className="mb-2 block">
          議事録テキスト
        </Label>
        <textarea
          id="raw-text-input"
          name="rawText"
          aria-label="議事録テキスト入力欄"
          className="w-full h-96 p-4 border rounded-md font-mono text-sm"
          defaultValue={sampleText}
        />
      </div>

      <div className="flex justify-end gap-4">
        <SaveButton />
      </div>

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          💡 <strong>このアプリについて：</strong>
        </p>
        <ul className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
          <li>AI機能はボタンを押すと実行されます（自動では実行されません）</li>
          <li>このアプリは入力テキスト（raw_text）を元にAI処理します</li>
          <li>保存・共有・検索・音声アップロードはログイン後に利用できます</li>
          <li>AIは入力テキストにない内容を創作しません</li>
        </ul>
      </div>
    </div>
  );
}

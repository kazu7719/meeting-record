'use client';

import { useState } from 'react';
import { SaveButton } from './save-button';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const SAMPLE_TEXT =
  '# 開発進捗定例（サンプル）\n\n' +
  '## 日時\n2025-01-15 10:00-11:00\n\n' +
  '## 参加者\n田中、佐藤、鈴木\n\n' +
  '## 議題\n1. 前回アクションの確認\n2. 今週の進捗報告\n\n' +
  '## 決定事項\n- ログイン機能を今週中に実装する（担当：田中）\n' +
  '- UI/UXレビューを来週実施する（担当：佐藤）';

const MAX_CHARS = 30000;

/**
 * ゲストトップ画面コンポーネント（Client Component）
 * Issue 5: raw_text登録と保存導線
 *
 * - サンプル議事録エリア表示
 * - 文字数カウンタ
 * - サンプル操作ボタン（挿入/クリア）
 * - 保存ボタン（Client Component）
 */
export function GuestTop() {
  const [rawText, setRawText] = useState(SAMPLE_TEXT);

  const handleInsertSample = () => {
    setRawText(SAMPLE_TEXT);
  };

  const handleClear = () => {
    setRawText('');
  };

  const charCount = rawText.length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="sample-meeting-area">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">サンプル議事録</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          サンプル議事録が入力されています。自由に編集できます。
        </p>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <Label htmlFor="raw-text-input">議事録テキスト</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleInsertSample}
              type="button"
            >
              サンプル議事録を挿入
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              type="button"
            >
              クリア
            </Button>
          </div>
        </div>

        <textarea
          id="raw-text-input"
          name="rawText"
          aria-label="議事録テキスト入力欄"
          className="w-full h-96 p-4 border rounded-md font-mono text-sm"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />

        <div className="mt-2 flex justify-between items-center text-sm">
          <span
            className={`${
              isOverLimit
                ? 'text-red-600 dark:text-red-400 font-semibold'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            文字数: {charCount.toLocaleString()} / {MAX_CHARS.toLocaleString()}
          </span>
          {isOverLimit && (
            <span className="text-red-600 dark:text-red-400 font-semibold">
              ⚠️ 30,000文字を超えています
            </span>
          )}
        </div>
      </div>

      {/* AI実行ボタンエリア */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
        <h3 className="text-lg font-semibold mb-3">AI機能</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          以下のボタンを押すとAI処理が実行されます（自動では実行されません）
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="default" disabled={!rawText.trim() || isOverLimit}>
            要約を生成
          </Button>
          <Button variant="default" disabled={!rawText.trim() || isOverLimit}>
            アクションを抽出
          </Button>
          <Button variant="default" disabled={!rawText.trim() || isOverLimit}>
            質問する（QA）
          </Button>
        </div>
      </div>

      {/* 保存ボタンエリア */}
      <div className="flex justify-end gap-4">
        <SaveButton rawText={rawText} />
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

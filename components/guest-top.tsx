'use client';

import { useState } from 'react';
import { SaveButton } from './save-button';
import { AiControls } from './ai-controls';
import { SummaryResult } from './summary-result';
import { ActionsResult } from './actions-result';
import { QAResultDisplay } from './qa-result';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { generateSummary } from '@/app/actions/generate-summary';
import { extractActions, type ActionItem } from '@/app/actions/extract-actions';
import { executeQA, type QAResult } from '@/app/actions/qa-answer';

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
 * Issue 5, 7, 8, 9: raw_text登録・AI要約・アクション抽出・QA
 *
 * - サンプル議事録エリア表示
 * - 文字数カウンタ
 * - サンプル操作ボタン（挿入/クリア）
 * - AI機能（要約・アクション抽出・QA）
 * - 保存ボタン（Client Component）
 */
export function GuestTop() {
  const [rawText, setRawText] = useState(SAMPLE_TEXT);
  const [summary, setSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [actions, setActions] = useState<ActionItem[] | null>(null);
  const [isExtractingActions, setIsExtractingActions] = useState(false);
  const [actionsError, setActionsError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [qaResult, setQaResult] = useState<QAResult | null>(null);
  const [isExecutingQA, setIsExecutingQA] = useState(false);
  const [qaError, setQaError] = useState<string | null>(null);

  const handleInsertSample = () => {
    setRawText(SAMPLE_TEXT);
  };

  const handleClear = () => {
    setRawText('');
  };

  const handleGenerateSummary = async () => {
    setSummaryError(null);
    setIsGeneratingSummary(true);

    try {
      const result = await generateSummary({ rawText });

      if (result.success && result.summary) {
        setSummary(result.summary);
      } else {
        setSummaryError(result.error || '要約生成に失敗しました');
      }
    } catch (error) {
      console.error('Summary generation error:', error);
      setSummaryError('エラーが発生しました。しばらく経ってから再度お試しください');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleExtractActions = async () => {
    setActionsError(null);
    setIsExtractingActions(true);

    try {
      const result = await extractActions({ rawText });

      if (result.success && result.actions) {
        setActions(result.actions);
      } else {
        setActionsError(result.error || 'アクション抽出に失敗しました');
      }
    } catch (error) {
      console.error('Action extraction error:', error);
      setActionsError('エラーが発生しました。しばらく経ってから再度お試しください');
    } finally {
      setIsExtractingActions(false);
    }
  };

  const handleExecuteQA = async () => {
    setQaError(null);
    setIsExecutingQA(true);

    try {
      const result = await executeQA({ rawText, question });

      if (result.success && result.result) {
        setQaResult(result.result);
      } else {
        setQaError(result.error || 'QA処理に失敗しました');
      }
    } catch (error) {
      console.error('QA execution error:', error);
      setQaError('エラーが発生しました。しばらく経ってから再度お試しください');
    } finally {
      setIsExecutingQA(false);
    }
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
      <AiControls
        rawText={rawText}
        isOverLimit={isOverLimit}
        isGeneratingSummary={isGeneratingSummary}
        onGenerateSummary={handleGenerateSummary}
        isExtractingActions={isExtractingActions}
        onExtractActions={handleExtractActions}
        question={question}
        onQuestionChange={setQuestion}
        isExecutingQA={isExecutingQA}
        onExecuteQA={handleExecuteQA}
      />

      {/* AI結果表示エリア */}
      <SummaryResult summary={summary} error={summaryError} />

      <ActionsResult actions={actions} error={actionsError} />

      <QAResultDisplay result={qaResult} error={qaError} />

      {/* 保存ボタンエリア */}
      <div className="flex justify-end gap-4">
        <SaveButton rawText={rawText} summary={summary} actions={actions} />
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

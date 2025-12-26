'use client';

import { useState } from 'react';
import { Button } from './ui/button';
import { generateSummary } from '@/app/actions/generate-summary';
import { extractActions } from '@/app/actions/extract-actions';
import { updateSummary } from '@/app/actions/update-summary';
import { saveActions } from '@/app/actions/save-actions';

interface ActionItem {
  id?: string;
  task_content: string;
  assignee_name: string | null;
  due_at: string | null;
  note: string | null;
  evidence: string;
  created_at?: string;
}

interface MinuteDetailAIProps {
  minuteId: string;
  rawText: string;
  initialSummary: string | null;
  initialActionItems: ActionItem[];
  isOwner: boolean;
}

export function MinuteDetailAI({
  minuteId,
  rawText,
  initialSummary,
  initialActionItems,
  isOwner,
}: MinuteDetailAIProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [actionItems, setActionItems] = useState(initialActionItems);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isExtractingActions, setIsExtractingActions] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [actionsError, setActionsError] = useState('');

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryError('');

    try {
      const result = await generateSummary({ rawText });

      if (result.success && result.summary) {
        setSummary(result.summary);

        // 要約を自動保存（isOwner の場合のみ）
        if (isOwner) {
          const saveResult = await updateSummary(minuteId, result.summary);
          if (!saveResult.success) {
            setSummaryError(saveResult.error || '要約の保存に失敗しました');
          }
        }
      } else {
        setSummaryError(result.error || '要約の生成に失敗しました');
      }
    } catch (error) {
      console.error('Summary generation error:', error);
      setSummaryError('エラーが発生しました。しばらく経ってから再度お試しください');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleExtractActions = async () => {
    setIsExtractingActions(true);
    setActionsError('');

    try {
      const result = await extractActions({ rawText });

      if (result.success && result.actions) {
        setActionItems(result.actions);

        // アクションアイテムを自動保存（isOwner の場合のみ）
        if (isOwner) {
          const saveResult = await saveActions({ minuteId, actions: result.actions });
          if (!saveResult.success) {
            setActionsError(saveResult.error || 'アクションアイテムの保存に失敗しました');
          } else {
            // 保存成功後、ページをリロードして最新のデータを取得
            window.location.reload();
          }
        }
      } else {
        setActionsError(result.error || 'アクションアイテムの抽出に失敗しました');
      }
    } catch (error) {
      console.error('Actions extraction error:', error);
      setActionsError('エラーが発生しました。しばらく経ってから再度お試しください');
    } finally {
      setIsExtractingActions(false);
    }
  };

  return (
    <>
      {/* AI Controls */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">AI機能</h2>
        <div className="flex gap-4">
          <Button
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary || !isOwner}
            className="flex-1"
          >
            {isGeneratingSummary ? '生成中...' : '要約を生成'}
          </Button>
          <Button
            onClick={handleExtractActions}
            disabled={isExtractingActions || !isOwner}
            className="flex-1"
          >
            {isExtractingActions ? '抽出中...' : 'アクションを抽出'}
          </Button>
        </div>
        {!isOwner && (
          <p className="text-sm text-gray-500 mt-2">
            ※ AI機能は議事録の作成者のみ利用できます
          </p>
        )}
      </section>

      {/* Summary Section */}
      {summary && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">要約</h2>
          <div className="border rounded-lg p-6 bg-blue-50 dark:bg-blue-900/20 whitespace-pre-wrap">
            {summary}
          </div>
        </section>
      )}
      {summaryError && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{summaryError}</p>
        </div>
      )}

      {/* Action Items Section */}
      {actionItems && actionItems.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">アクションプラン</h2>
          <div className="space-y-4">
            {actionItems.map((item, index) => (
              <div
                key={item.id || index}
                className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm"
              >
                <h3 className="font-semibold text-lg mb-2">{item.task_content}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <div>
                    <span className="font-medium">担当者:</span>{' '}
                    {item.assignee_name || '未定'}
                  </div>
                  <div>
                    <span className="font-medium">期限:</span>{' '}
                    {item.due_at
                      ? new Date(item.due_at).toLocaleDateString('ja-JP')
                      : '未定'}
                  </div>
                </div>
                {item.note && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <span className="font-medium">補足:</span> {item.note}
                  </p>
                )}
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                    根拠を表示
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 whitespace-pre-wrap">
                    {item.evidence}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </section>
      )}
      {actionsError && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{actionsError}</p>
        </div>
      )}
    </>
  );
}

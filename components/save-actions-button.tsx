'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  saveActions,
  getLatestMinute,
} from '@/app/actions/save-actions';
import type { ActionItem } from '@/app/actions/extract-actions';

interface SaveActionsButtonProps {
  actions: ActionItem[];
}

/**
 * アクション保存ボタンコンポーネント（Client Component）
 * Issue 8: ログイン後のaction_items保存機能
 *
 * - 未ログイン: ログイン誘導
 * - minutes未保存: 保存誘導メッセージ
 * - minutes保存済み: action_items保存
 */
export function SaveActionsButton({ actions }: SaveActionsButtonProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // 1. ログイン認証チェック
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // 未ログイン：ログインページへ誘導
        router.push('/auth/login');
        return;
      }

      // 2. 最新のminuteを取得
      const minuteResult = await getLatestMinute();

      if (!minuteResult.success || !minuteResult.minuteId) {
        // minutes未保存：保存誘導
        setMessage({
          type: 'info',
          text: '先に議事録を保存してください。下の「議事録を保存」ボタンから保存できます。',
        });
        setIsSaving(false);
        return;
      }

      // 3. action_items保存
      const saveResult = await saveActions({
        minuteId: minuteResult.minuteId,
        actions,
      });

      if (saveResult.success) {
        setMessage({
          type: 'success',
          text: `${saveResult.savedCount}件のアクション項目を保存しました（議事録: ${minuteResult.title}）`,
        });
      } else {
        setMessage({
          type: 'error',
          text: saveResult.error || 'アクション項目の保存に失敗しました',
        });
      }
    } catch (error) {
      console.error('Save actions error:', error);
      setMessage({
        type: 'error',
        text: 'エラーが発生しました。しばらく経ってから再度お試しください',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-4">
      <Button
        onClick={handleSave}
        disabled={isSaving || actions.length === 0}
        variant="default"
      >
        {isSaving ? '保存中...' : 'アクションを保存'}
      </Button>

      {message && (
        <div
          className={`mt-3 p-3 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : message.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-700'
                : 'bg-blue-50 border border-blue-200 text-blue-700'
          }`}
          role={message.type === 'error' ? 'alert' : 'status'}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

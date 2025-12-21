'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

/**
 * 保存ボタンコンポーネント（Client Component）
 * Issue 1: 認証設計
 *
 * - 未ログイン時：ログインページへ誘導
 * - ログイン後：保存処理へ（Issue 5で実装）
 */
export function SaveButton() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setIsCheckingAuth(true);
    setError(null);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // 未ログイン：ログインページへ誘導
        router.push('/auth/login');
        return;
      }

      // ログイン済み：保存処理へ（Issue 5で実装）
      alert('保存機能はIssue 5で実装されます');
    } catch (error) {
      // ユーザー向けエラーメッセージを表示
      setError('エラーが発生しました。しばらく経ってから再度お試しください');
      console.error('Error checking auth:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  return (
    <div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-2">
          {error}
        </p>
      )}
      <Button onClick={handleSave} disabled={isCheckingAuth}>
        {isCheckingAuth ? '確認中...' : '保存'}
      </Button>
    </div>
  );
}

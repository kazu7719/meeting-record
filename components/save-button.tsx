'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { SaveDialog } from './save-dialog';

interface SaveButtonProps {
  rawText: string;
}

/**
 * 保存ボタンコンポーネント
 * Issue 5: raw_text登録と保存導線
 *
 * - 未ログイン：ログインページへ誘導
 * - ログイン済：保存ダイアログを開く
 */
export function SaveButton({ rawText }: SaveButtonProps) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

      // ログイン済み：保存ダイアログを開く
      setIsDialogOpen(true);
    } catch (error) {
      // ユーザー向けエラーメッセージを表示
      setError('エラーが発生しました。しばらく経ってから再度お試しください');
      console.error('Error checking auth:', error);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  return (
    <>
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

      <SaveDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        rawText={rawText}
      />
    </>
  );
}

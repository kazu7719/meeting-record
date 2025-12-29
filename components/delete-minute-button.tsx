'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { deleteMinute } from '@/app/actions/delete-minute';
import { ROUTES } from '@/lib/routes';

interface DeleteMinuteButtonProps {
  minuteId: string;
  minuteTitle: string;
}

export function DeleteMinuteButton({
  minuteId,
  minuteTitle,
}: DeleteMinuteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const result = await deleteMinute(minuteId);

      if (result.success) {
        router.push(ROUTES.MINUTES_LIST);
      } else {
        alert(result.error || '削除に失敗しました');
        setIsDeleting(false);
        setShowConfirm(false);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('エラーが発生しました。しばらく経ってから再度お試しください');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        role="dialog"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <h2 id="delete-dialog-title" className="text-xl font-bold mb-4">
            議事録の削除
          </h2>
          <p id="delete-dialog-description" className="text-gray-600 dark:text-gray-400 mb-6">
            「{minuteTitle}」を削除してもよろしいですか？
            <br />
            この操作は取り消せません。
          </p>
          <div className="flex gap-4 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? '削除中...' : '削除'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      variant="destructive"
      onClick={() => setShowConfirm(true)}
      disabled={isDeleting}
    >
      削除
    </Button>
  );
}

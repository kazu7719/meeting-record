'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { saveMinute } from '@/app/actions/save-minute';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rawText: string;
}

export function SaveDialog({ open, onOpenChange, rawText }: SaveDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // クライアント側バリデーション
    if (!title.trim()) {
      setError('タイトルは必須です');
      return;
    }

    setIsSaving(true);

    try {
      const result = await saveMinute({
        title,
        meetingDate: meetingDate || null,
        rawText,
      });

      if (result.success && result.minuteId) {
        // 保存成功：議事録詳細ページへリダイレクト
        router.push(`/protected/minutes/${result.minuteId}`);
        onOpenChange(false);
        // ダイアログを閉じた後にフォームをリセット
        setTitle('');
        setMeetingDate('');
      } else {
        // エラー表示
        setError(result.error || '保存に失敗しました');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('エラーが発生しました。しばらく経ってから再度お試しください');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>議事録を保存</DialogTitle>
          <DialogDescription>
            会議名と会議日を入力して保存してください。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">会議名（必須）</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：開発進捗定例"
              disabled={isSaving}
              required
              aria-required="true"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meeting-date">会議日（任意）</Label>
            <Input
              id="meeting-date"
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm" role="alert">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

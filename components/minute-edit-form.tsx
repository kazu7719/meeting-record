'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateMinute } from '@/app/actions/update-minute';
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';

const MAX_CHARS = 30000;

interface MinuteEditFormProps {
  minuteId: string;
  initialTitle: string;
  initialMeetingDate: string | null;
  initialRawText: string;
}

export function MinuteEditForm({
  minuteId,
  initialTitle,
  initialMeetingDate,
  initialRawText,
}: MinuteEditFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [meetingDate, setMeetingDate] = useState(initialMeetingDate || '');
  const [rawText, setRawText] = useState(initialRawText);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isOverLimit = rawText.length > MAX_CHARS;
  const canSave = title.trim() !== '' && rawText.trim() !== '' && !isOverLimit;

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    setError('');

    try {
      const result = await updateMinute({
        minuteId,
        title: title.trim(),
        meetingDate: meetingDate || null,
        rawText,
      });

      if (result.success && result.minuteId) {
        router.push(ROUTES.MINUTES_DETAIL(result.minuteId));
      } else {
        setError(result.error || '更新に失敗しました');
      }
    } catch (err) {
      console.error('Update error:', err);
      setError('エラーが発生しました。しばらく経ってから再度お試しください');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 基本情報エリア */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* タイトル */}
        <div>
          <Label htmlFor="title">
            タイトル <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 開発進捗定例"
            className="mt-1"
            required
          />
        </div>

        {/* 会議日 */}
        <div>
          <Label htmlFor="meeting-date">会議日（任意）</Label>
          <Input
            id="meeting-date"
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {/* 議事録本文 */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label htmlFor="raw-text" className="text-lg font-semibold">
            議事録本文 <span className="text-red-500">*</span>
          </Label>
          <span
            className={`text-sm ${
              isOverLimit
                ? 'text-red-500 font-bold'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {rawText.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}{' '}
            文字
          </span>
        </div>
        <textarea
          id="raw-text"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="w-full h-[600px] p-4 border-2 border-gray-300 rounded-lg resize-y font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 transition-colors"
          placeholder="会議の議事録テキストを貼り付けてください..."
          required
        />
        {isOverLimit && (
          <p className="text-red-500 text-sm mt-2 font-medium">
            ⚠️ 文字数が上限を超えています。{MAX_CHARS.toLocaleString()}
            文字以内に収めてください。
          </p>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          ※ テキストエリアは上下にドラッグしてサイズを調整できます
        </p>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* ボタン */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" asChild disabled={isSaving}>
          <Link href={ROUTES.MINUTES_DETAIL(minuteId)}>キャンセル</Link>
        </Button>
        <Button onClick={handleSave} disabled={!canSave || isSaving}>
          {isSaving ? '更新中...' : '更新'}
        </Button>
      </div>
    </div>
  );
}

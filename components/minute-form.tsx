'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveMinute } from '@/app/actions/save-minute';
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';

const MAX_CHARS = 30000;

interface Team {
  id: string;
  name: string;
  role: string;
}

interface MinuteFormProps {
  teams: Team[];
  currentTeamId?: string;
}

export function MinuteForm({ teams, currentTeamId }: MinuteFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [rawText, setRawText] = useState('');
  const [departmentId, setDepartmentId] = useState(
    currentTeamId || teams[0]?.id || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const isOverLimit = rawText.length > MAX_CHARS;
  const canSave =
    title.trim() !== '' &&
    rawText.trim() !== '' &&
    departmentId !== '' &&
    !isOverLimit;

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    setError('');

    try {
      const result = await saveMinute({
        title: title.trim(),
        meetingDate: meetingDate || null,
        rawText,
        departmentId,
      });

      if (result.success && result.minuteId) {
        router.push(ROUTES.MINUTES_DETAIL(result.minuteId));
      } else {
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
    <div className="space-y-6">
      {/* チーム選択 */}
      <div>
        <Label htmlFor="team">
          保存先チーム <span className="text-red-500">*</span>
        </Label>
        <select
          id="team"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
          required
        >
          <option value="" disabled>
            チームを選択してください
          </option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
              {team.id === currentTeamId ? ' (現在のチーム)' : ''}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          選択したチームのメンバーが議事録を閲覧できます
        </p>
      </div>

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

      {/* 議事録本文 */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <Label htmlFor="raw-text">
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
          className="w-full h-96 p-4 border rounded-lg resize-none font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
          placeholder="会議の議事録テキストを貼り付けてください..."
          required
        />
        {isOverLimit && (
          <p className="text-red-500 text-sm mt-1">
            文字数が上限を超えています。{MAX_CHARS.toLocaleString()}
            文字以内に収めてください。
          </p>
        )}
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
          <Link href={ROUTES.MINUTES_LIST}>キャンセル</Link>
        </Button>
        <Button onClick={handleSave} disabled={!canSave || isSaving}>
          {isSaving ? '保存中...' : '保存'}
        </Button>
      </div>
    </div>
  );
}

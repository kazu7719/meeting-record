'use client';

import { useState } from 'react';
import { joinTeamByInvitation } from '@/app/teams/actions';
import { useRouter } from 'next/navigation';

interface InviteAcceptProps {
  token: string;
  teamName: string;
  isExpired: boolean;
  isMaxUsesReached: boolean;
}

export default function InviteAccept({
  token,
  teamName,
  isExpired,
  isMaxUsesReached,
}: InviteAcceptProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleAccept = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await joinTeamByInvitation(token);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/teams');
        }, 2000);
      } else {
        setError(result.error || 'チームへの参加に失敗しました');
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 text-center bg-green-50 rounded-lg border border-green-200">
        <h1 className="text-2xl font-bold text-green-900 mb-2">
          参加が完了しました！
        </h1>
        <p className="text-green-700 mb-6">
          「{teamName}」に参加しました。チーム管理画面に移動します...
        </p>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="p-8 text-center bg-yellow-50 rounded-lg border border-yellow-200">
        <h1 className="text-2xl font-bold text-yellow-900 mb-2">
          招待リンクの有効期限が切れています
        </h1>
        <p className="text-yellow-700 mb-6">
          この招待リンクは有効期限が切れています。チームのオーナーに新しい招待リンクを発行してもらってください。
        </p>
        <a
          href="/teams"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          チーム管理に戻る
        </a>
      </div>
    );
  }

  if (isMaxUsesReached) {
    return (
      <div className="p-8 text-center bg-yellow-50 rounded-lg border border-yellow-200">
        <h1 className="text-2xl font-bold text-yellow-900 mb-2">
          招待リンクの利用上限に達しています
        </h1>
        <p className="text-yellow-700 mb-6">
          この招待リンクは利用上限に達しています。チームのオーナーに新しい招待リンクを発行してもらってください。
        </p>
        <a
          href="/teams"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          チーム管理に戻る
        </a>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-lg border border-gray-200 shadow-lg">
      <h1 className="text-2xl font-bold mb-2">チームへの招待</h1>
      <p className="text-gray-600 mb-6">
        「<span className="font-semibold text-gray-900">{teamName}</span>
        」に招待されています
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-900 mb-2">
          <strong>チームに参加すると:</strong>
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>チーム内の議事録を閲覧できます</li>
          <li>チーム内で議事録を共有できます</li>
          <li>いつでもチームを切り替えられます</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleAccept}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {isLoading ? '参加中...' : 'チームに参加する'}
        </button>
        <a
          href="/teams"
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center"
        >
          キャンセル
        </a>
      </div>
    </div>
  );
}

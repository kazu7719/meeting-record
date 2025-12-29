'use client';

import { useState, useEffect } from 'react';
import {
  generateInvitation,
  getTeamInvitations,
  type Invitation,
} from '@/app/teams/actions';

interface InvitationManagerProps {
  teamId: string;
}

export default function InvitationManager({ teamId }: InvitationManagerProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const loadInvitations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getTeamInvitations(teamId);

      if (result.success && result.invitations) {
        setInvitations(result.invitations);
      } else {
        setError(result.error || '招待リンクの取得に失敗しました');
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await generateInvitation(teamId);

      if (result.success) {
        await loadInvitations();
      } else {
        setError(result.error || '招待リンクの生成に失敗しました');
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const baseUrl =
      typeof window !== 'undefined' ? window.location.origin : '';
    const inviteUrl = `${baseUrl}/invite?token=${token}`;

    navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold">招待リンク管理</h4>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? '生成中...' : '+ 新しい招待リンク'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {isLoading && invitations.length === 0 ? (
        <div className="text-center py-4 text-gray-500">読み込み中...</div>
      ) : invitations.length === 0 ? (
        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded border border-gray-200">
          招待リンクがまだありません
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((invitation) => {
            const isExpired = new Date(invitation.expires_at) < new Date();
            const isMaxUsesReached =
              invitation.max_uses !== null &&
              invitation.use_count >= invitation.max_uses;
            const isActive = !isExpired && !isMaxUsesReached;

            return (
              <div
                key={invitation.id}
                className={`p-3 rounded border ${
                  isActive
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        isActive
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-400 text-white'
                      }`}
                    >
                      {isActive ? '有効' : isExpired ? '期限切れ' : '上限到達'}
                    </span>
                    <span className="text-sm text-gray-600">
                      使用回数: {invitation.use_count}
                      {invitation.max_uses !== null &&
                        ` / ${invitation.max_uses}`}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    有効期限:{' '}
                    {new Date(invitation.expires_at).toLocaleDateString(
                      'ja-JP'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <code className="flex-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono overflow-x-auto">
                    {typeof window !== 'undefined'
                      ? `${window.location.origin}/invite?token=${invitation.token}`
                      : `...?token=${invitation.token}`}
                  </code>
                  <button
                    onClick={() => copyInviteLink(invitation.token)}
                    disabled={!isActive}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                  >
                    {copiedToken === invitation.token
                      ? 'コピー済み'
                      : 'コピー'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

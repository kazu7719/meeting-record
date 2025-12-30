'use client';

import { useState } from 'react';
import { switchTeam, leaveTeam, deleteTeam, updateTeam, type UserTeam } from '@/app/teams/actions';
import { useRouter } from 'next/navigation';
import InvitationManager from './invitation-manager';

interface TeamListProps {
  teams: UserTeam[];
  currentTeamId?: string;
}

export default function TeamList({ teams, currentTeamId }: TeamListProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const router = useRouter();

  const handleSwitch = async (teamId: string) => {
    setError(null);
    setIsLoading(teamId);

    try {
      const result = await switchTeam(teamId);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'チームの切り替えに失敗しました');
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error(err);
    } finally {
      setIsLoading(null);
    }
  };

  const handleLeave = async (teamId: string) => {
    if (!confirm('本当にこのチームから退出しますか？')) {
      return;
    }

    setError(null);
    setIsLoading(teamId);

    try {
      const result = await leaveTeam(teamId);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'チームからの退出に失敗しました');
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error(err);
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async (teamId: string, teamName: string) => {
    if (!confirm(`本当に「${teamName}」を削除しますか？\n\nこの操作は取り消せません。チームに関連する全ての議事録も削除されます。`)) {
      return;
    }

    setError(null);
    setIsLoading(teamId);

    try {
      const result = await deleteTeam(teamId);

      if (result.success) {
        router.refresh();
      } else {
        setError(result.error || 'チームの削除に失敗しました');
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error(err);
    } finally {
      setIsLoading(null);
    }
  };

  const toggleExpand = (teamId: string) => {
    setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
  };

  const startEdit = (teamId: string, currentName: string) => {
    setEditingTeamId(teamId);
    setEditingTeamName(currentName);
  };

  const cancelEdit = () => {
    setEditingTeamId(null);
    setEditingTeamName('');
  };

  const handleUpdate = async (teamId: string) => {
    setError(null);
    setIsLoading(teamId);

    try {
      const result = await updateTeam(teamId, editingTeamName);

      if (result.success) {
        setEditingTeamId(null);
        setEditingTeamName('');
        router.refresh();
      } else {
        setError(result.error || 'チーム名の変更に失敗しました');
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error(err);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {teams.map((team) => {
        const isCurrent = team.id === currentTeamId;
        const isExpanded = expandedTeamId === team.id;
        const canManageInvites = team.role === 'owner' || team.role === 'admin';

        return (
          <div
            key={team.id}
            className={`border rounded-lg p-4 ${
              isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {editingTeamId === team.id ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={editingTeamName}
                      onChange={(e) => setEditingTeamName(e.target.value)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={100}
                      disabled={isLoading === team.id}
                    />
                    <button
                      onClick={() => handleUpdate(team.id)}
                      disabled={isLoading === team.id || !editingTeamName.trim()}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      保存
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={isLoading === team.id}
                      className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{team.name}</h3>
                    {isCurrent && (
                      <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                        現在のチーム
                      </span>
                    )}
                    {team.role === 'owner' && (
                      <button
                        onClick={() => startEdit(team.id, team.name)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        編集
                      </button>
                    )}
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-1">
                  役割:{' '}
                  {team.role === 'owner'
                    ? 'オーナー'
                    : team.role === 'admin'
                      ? '管理者'
                      : 'メンバー'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  参加日:{' '}
                  {new Date(team.joined_at).toLocaleDateString('ja-JP')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {!isCurrent && (
                  <button
                    onClick={() => handleSwitch(team.id)}
                    disabled={isLoading === team.id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoading === team.id ? '切り替え中...' : '切り替え'}
                  </button>
                )}

                {canManageInvites && (
                  <button
                    onClick={() => toggleExpand(team.id)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    {isExpanded ? '閉じる' : '招待管理'}
                  </button>
                )}

                {team.role === 'owner' ? (
                  <button
                    onClick={() => handleDelete(team.id, team.name)}
                    disabled={isLoading === team.id}
                    className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoading === team.id ? '削除中...' : '削除'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleLeave(team.id)}
                    disabled={isLoading === team.id}
                    className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isLoading === team.id ? '退出中...' : '退出'}
                  </button>
                )}
              </div>
            </div>

            {isExpanded && canManageInvites && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <InvitationManager teamId={team.id} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

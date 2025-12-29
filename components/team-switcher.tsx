'use client';

import { useState } from 'react';
import { switchTeam, type UserTeam } from '@/app/teams/actions';
import { useRouter } from 'next/navigation';

interface TeamSwitcherProps {
  teams: UserTeam[];
  currentTeam?: UserTeam;
}

export default function TeamSwitcher({
  teams,
  currentTeam,
}: TeamSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSwitch = async (teamId: string) => {
    if (teamId === currentTeam?.id) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);

    try {
      const result = await switchTeam(teamId);

      if (result.success) {
        setIsOpen(false);
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to switch team:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (teams.length === 0) {
    return (
      <a
        href="/teams"
        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
      >
        チーム管理
      </a>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        disabled={isLoading}
      >
        <span className="font-medium">
          {currentTeam?.name || 'チームを選択'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                チーム一覧
              </div>
              {teams.map((team) => {
                const isCurrent = team.id === currentTeam?.id;
                return (
                  <button
                    key={team.id}
                    onClick={() => handleSwitch(team.id)}
                    disabled={isLoading}
                    className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 disabled:opacity-50 ${
                      isCurrent ? 'bg-blue-50 text-blue-900 font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{team.name}</span>
                      {isCurrent && (
                        <svg
                          className="w-4 h-4 text-blue-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {team.role === 'owner'
                        ? 'オーナー'
                        : team.role === 'admin'
                          ? '管理者'
                          : 'メンバー'}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-gray-200 p-2">
              <a
                href="/teams"
                className="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-100 rounded"
                onClick={() => setIsOpen(false)}
              >
                チーム管理画面へ
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

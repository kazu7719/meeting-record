'use client';

import { useState, useEffect, useRef } from 'react';
import { createTeam } from '@/app/teams/actions';
import { useRouter } from 'next/navigation';

export default function TeamCreateDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);

  const closeDialog = () => {
    setIsOpen(false);
    setTeamName('');
    setError(null);
  };

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        closeDialog();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading]);

  // Focus management
  useEffect(() => {
    if (!isOpen) return;

    const firstInput = dialogRef.current?.querySelector('input');
    if (firstInput) {
      firstInput.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await createTeam(teamName);

      if (result.success) {
        closeDialog();
        router.refresh();
      } else {
        setError(result.error || 'チームの作成に失敗しました');
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        + 新しいチームを作成
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => !isLoading && closeDialog()}
        >
          <div
            ref={dialogRef}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dialog-title" className="text-2xl font-bold mb-4">
              新しいチームを作成
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="teamName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  チーム名
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 開発チーム"
                  required
                  maxLength={100}
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {teamName.length}/100文字
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeDialog}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isLoading}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading || !teamName.trim()}
                >
                  {isLoading ? '作成中...' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

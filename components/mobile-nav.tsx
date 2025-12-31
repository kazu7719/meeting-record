'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { logout } from '@/app/auth/actions';

interface MobileNavProps {
  isLoggedIn: boolean;
  userEmail?: string;
}

export function MobileNav({ isLoggedIn, userEmail }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    closeMenu();

    try {
      const result = await logout();

      if (result.success) {
        router.push(ROUTES.HOME);
        router.refresh();
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="md:hidden">
      {/* ハンバーガーメニューボタン */}
      <button
        onClick={toggleMenu}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="メニューを開く"
        aria-expanded={isOpen}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* モバイルメニュー（オーバーレイ） */}
      {isOpen && (
        <>
          {/* 背景オーバーレイ */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* メニュー本体 */}
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white dark:bg-gray-900 z-50 shadow-xl">
            <div className="flex flex-col h-full">
              {/* ヘッダー */}
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
                <span className="font-semibold">メニュー</span>
                <button
                  onClick={closeMenu}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="メニューを閉じる"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* ナビゲーションリンク */}
              <nav className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-2">
                  <li>
                    <Link
                      href={ROUTES.HOME}
                      onClick={closeMenu}
                      className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      ホーム
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={ROUTES.MINUTES_LIST}
                      onClick={closeMenu}
                      className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      議事録一覧
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={ROUTES.TEAMS}
                      onClick={closeMenu}
                      className="block px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      チーム管理
                    </Link>
                  </li>
                </ul>
              </nav>

              {/* ユーザー情報とアクション */}
              <div className="p-4 border-t dark:border-gray-800">
                {isLoggedIn ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {userEmail}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                    >
                      {isLoggingOut ? 'ログアウト中...' : 'ログアウト'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href={ROUTES.LOGIN} onClick={closeMenu}>
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        ログイン
                      </Button>
                    </Link>
                    <Link href={ROUTES.SIGNUP} onClick={closeMenu}>
                      <Button
                        className="w-full"
                      >
                        サインアップ
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

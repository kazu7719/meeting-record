'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

/**
 * 検索フォームコンポーネント（Client Component）
 * Issue 10: 議事録検索機能
 *
 * - title（部分一致）
 * - meeting_date範囲（from/to）
 * - raw_text（部分一致キーワード）
 * - URLパラメータで検索条件を管理
 */
export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 現在のURLパラメータから初期値を取得
  const [title, setTitle] = useState(searchParams.get('title') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');

  const handleSearch = () => {
    const params = new URLSearchParams();

    if (title.trim()) {
      params.set('title', title.trim());
    }
    if (dateFrom) {
      params.set('dateFrom', dateFrom);
    }
    if (dateTo) {
      params.set('dateTo', dateTo);
    }
    if (keyword.trim()) {
      params.set('keyword', keyword.trim());
    }

    // URLパラメータを更新してページ遷移
    router.push(`/protected/minutes?${params.toString()}`);
  };

  const handleClear = () => {
    setTitle('');
    setDateFrom('');
    setDateTo('');
    setKeyword('');
    router.push('/protected/minutes');
  };

  // 現在の検索条件が存在するかチェック
  const hasSearchConditions =
    searchParams.get('title') ||
    searchParams.get('dateFrom') ||
    searchParams.get('dateTo') ||
    searchParams.get('keyword');

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
      <h2 className="text-lg font-semibold mb-4">検索条件</h2>

      {/* 検索条件表示エリア */}
      {hasSearchConditions && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            現在の検索条件:
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            {searchParams.get('title') && (
              <li>タイトル: 「{searchParams.get('title')}」</li>
            )}
            {searchParams.get('dateFrom') && (
              <li>開始日: {searchParams.get('dateFrom')}</li>
            )}
            {searchParams.get('dateTo') && (
              <li>終了日: {searchParams.get('dateTo')}</li>
            )}
            {searchParams.get('keyword') && (
              <li>キーワード: 「{searchParams.get('keyword')}」</li>
            )}
          </ul>
        </div>
      )}

      <div className="space-y-4">
        {/* タイトル検索 */}
        <div>
          <Label htmlFor="search-title" className="text-sm font-medium">
            タイトル（部分一致）
          </Label>
          <Input
            id="search-title"
            type="text"
            placeholder="例: 開発進捗"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1"
          />
        </div>

        {/* 会議日範囲検索 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="search-date-from" className="text-sm font-medium">
              会議日（開始）
            </Label>
            <Input
              id="search-date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="search-date-to" className="text-sm font-medium">
              会議日（終了）
            </Label>
            <Input
              id="search-date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* キーワード検索 */}
        <div>
          <Label htmlFor="search-keyword" className="text-sm font-medium">
            本文キーワード（部分一致）
          </Label>
          <Input
            id="search-keyword"
            type="text"
            placeholder="例: ログイン機能"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            議事録本文（raw_text）から検索します
          </p>
        </div>

        {/* ボタンエリア */}
        <div className="flex gap-3">
          <Button variant="default" onClick={handleSearch}>
            検索
          </Button>
          <Button variant="outline" onClick={handleClear}>
            クリア
          </Button>
        </div>
      </div>
    </div>
  );
}

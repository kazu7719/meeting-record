import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SearchForm } from '@/components/search-form';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';

interface MinutesListPageProps {
  searchParams?: Promise<{
    title?: string;
    dateFrom?: string;
    dateTo?: string;
    keyword?: string;
  }>;
}

export default async function MinutesListPage({
  searchParams = Promise.resolve({}),
}: MinutesListPageProps) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(ROUTES.LOGIN);
  }

  // 検索条件を取得
  const params = await searchParams;
  const { title, dateFrom, dateTo, keyword } = params;

  // Fetch minutes list with search conditions (RLS will ensure only accessible minutes are returned)
  let query = supabase
    .from('minutes')
    .select('id, title, meeting_date, created_at, raw_text')
    .order('created_at', { ascending: false });

  // タイトル検索（部分一致）
  if (title) {
    query = query.ilike('title', `%${title}%`);
  }

  // 会議日範囲検索
  if (dateFrom) {
    query = query.gte('meeting_date', dateFrom);
  }
  if (dateTo) {
    query = query.lte('meeting_date', dateTo);
  }

  // キーワード検索（raw_text部分一致）
  if (keyword) {
    query = query.ilike('raw_text', `%${keyword}%`);
  }

  const { data: minutes, error: minutesError } = await query;

  if (minutesError) {
    console.error('Failed to fetch minutes:', minutesError);
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">議事録一覧</h1>
          </div>
          <Button asChild aria-label="新しい議事録を作成">
            <Link href={ROUTES.HOME}>新規議事録作成</Link>
          </Button>
        </div>
        <div className="text-center py-12 text-red-600 dark:text-red-400">
          <p className="mb-4">議事録の取得に失敗しました。</p>
          <p className="text-sm">しばらく経ってから再度お試しください。</p>
        </div>
      </div>
    );
  }

  // 検索条件が存在するかチェック
  const hasSearchConditions = title || dateFrom || dateTo || keyword;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">議事録一覧</h1>
          <p className="text-gray-600 dark:text-gray-400">
            保存された議事録を閲覧できます
          </p>
        </div>
        <Button asChild aria-label="新しい議事録を作成">
          <Link href={ROUTES.HOME}>新規議事録作成</Link>
        </Button>
      </div>

      {/* 検索フォーム */}
      <SearchForm />

      {/* 検索結果数表示 */}
      {hasSearchConditions && minutes && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          検索結果: {minutes.length}件
        </div>
      )}

      {!minutes || minutes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {hasSearchConditions
              ? '検索条件に一致する議事録が見つかりませんでした'
              : '議事録がまだありません'}
          </p>
          {!hasSearchConditions && (
            <Link
              href={ROUTES.HOME}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              トップページで議事録を作成する
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {minutes.map((minute) => (
            <Link
              key={minute.id}
              href={`/protected/minutes/${minute.id}`}
              className="block border rounded-lg p-6 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow"
            >
              <h2 className="text-xl font-semibold mb-2">{minute.title}</h2>
              <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                {minute.meeting_date && (
                  <div>
                    <span className="font-medium">会議日:</span>{' '}
                    {new Date(minute.meeting_date).toLocaleDateString('ja-JP')}
                  </div>
                )}
                <div>
                  <span className="font-medium">作成日:</span>{' '}
                  {new Date(minute.created_at).toLocaleDateString('ja-JP')}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

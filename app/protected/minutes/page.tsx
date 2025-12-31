import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { SearchForm } from '@/components/search-form';
import { UsageGuide } from '@/components/usage-guide';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/routes';
import { getCurrentTeam } from '@/app/teams/actions';

// Force dynamic rendering (uses searchParams)
export const dynamic = 'force-dynamic';

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

  // 現在のチーム情報を取得
  const currentTeamResult = await getCurrentTeam();
  const currentTeam = currentTeamResult.team;

  // 検索条件を取得
  const params = await searchParams;
  const { title, dateFrom, dateTo, keyword } = params;

  // Fetch minutes list with search conditions (RLS will ensure only accessible minutes are returned)
  let query = supabase
    .from('minutes')
    .select('id, title, meeting_date, created_at, raw_text, departments:department_id(name)')
    .order('created_at', { ascending: false });

  // 現在のチームでフィルタリング
  if (currentTeam?.id) {
    query = query.eq('department_id', currentTeam.id);
  }

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

    // エラーの種類に応じたメッセージ
    const errorMessage =
      minutesError.code === 'PGRST116'
        ? 'アクセス権限がありません。ログイン状態を確認してください。'
        : minutesError.message?.includes('network')
          ? 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
          : '議事録の取得に失敗しました。しばらく経ってから再度お試しください。';

    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">議事録一覧</h1>
          </div>
          <Button asChild aria-label="新しい議事録を作成" className="w-full sm:w-auto">
            <Link href={ROUTES.MINUTES_NEW}>新規議事録作成</Link>
          </Button>
        </div>
        <div className="text-center py-12" role="alert" aria-live="polite">
          <p className="mb-4 text-red-600 dark:text-red-400 font-semibold">
            {errorMessage}
          </p>
          <Button asChild className="mt-4">
            <Link href={ROUTES.MINUTES_NEW}>新しい議事録を作成する</Link>
          </Button>
        </div>
      </div>
    );
  }

  // チーム未設定時の対応
  if (!currentTeam) {
    return (
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">議事録一覧</h1>
          </div>
        </div>
        <div className="text-center py-12" role="alert" aria-live="polite">
          <p className="mb-4 text-yellow-600 dark:text-yellow-400 font-semibold">
            現在のチームが設定されていません
          </p>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            議事録を表示するには、チーム管理でチームを作成または切り替えてください。
          </p>
          <Button asChild className="mt-4">
            <Link href={ROUTES.TEAMS}>チーム管理に移動</Link>
          </Button>
        </div>
      </div>
    );
  }

  // 検索条件が存在するかチェック
  const hasSearchConditions = title || dateFrom || dateTo || keyword;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">議事録一覧</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            保存された議事録を閲覧できます
          </p>
        </div>
        <Button asChild aria-label="新しい議事録を作成" className="w-full sm:w-auto">
          <Link href={ROUTES.MINUTES_NEW}>新規議事録作成</Link>
        </Button>
      </div>

      {/* 使い方・注意事項 */}
      <UsageGuide />

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
              href={ROUTES.MINUTES_NEW}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
            >
              新しい議事録を作成する
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {minutes.map((minute) => {
            // departments は配列またはオブジェクトのいずれかで返される
            const department = Array.isArray(minute.departments)
              ? minute.departments[0]
              : minute.departments;

            return (
              <Link
                key={minute.id}
                href={`/protected/minutes/${minute.id}`}
                className="block border rounded-lg p-4 sm:p-6 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-2">{minute.title}</h2>
                <div className="flex flex-col sm:flex-row sm:gap-4 gap-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  {department?.name && (
                    <div>
                      <span className="font-medium">チーム:</span>{' '}
                      {department.name}
                    </div>
                  )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { MinuteForm } from '@/components/minute-form';
import { getUserTeams, getCurrentTeam } from '@/app/teams/actions';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/routes';

export default async function NewMinutePage() {
  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(ROUTES.LOGIN);
  }

  // ユーザーのチーム情報を取得
  const teamsResult = await getUserTeams();
  const currentTeamResult = await getCurrentTeam();

  // エラーハンドリング
  if (!teamsResult.success || !teamsResult.teams) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">議事録新規登録</h1>
        </div>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-semibold text-red-900 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-red-700 mb-4">
            {teamsResult.error || 'チーム情報の取得に失敗しました'}
          </p>
          <Link
            href={ROUTES.TEAMS}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            チーム管理に戻る
          </Link>
        </div>
      </div>
    );
  }

  // チームに所属していない場合
  if (teamsResult.teams.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">議事録新規登録</h1>
        </div>
        <div className="p-4 sm:p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-yellow-900 mb-2">
            チームに所属していません
          </h2>
          <p className="text-sm sm:text-base text-yellow-700 mb-4">
            議事録を作成するには、まずチームを作成するか、招待リンクからチームに参加してください。
          </p>
          <Link
            href={ROUTES.TEAMS}
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            チーム管理に移動
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">議事録新規登録</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          会議の議事録を登録します
        </p>
      </div>
      <MinuteForm
        teams={teamsResult.teams}
        currentTeamId={currentTeamResult.team?.id}
      />
    </div>
  );
}

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getUserTeams, getCurrentTeam } from './actions';
import TeamList from '@/components/team-list';
import TeamCreateDialog from '@/components/team-create-dialog';

export default async function TeamsPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's teams
  const teamsResult = await getUserTeams();
  const currentTeamResult = await getCurrentTeam();

  // Handle errors
  if (!teamsResult.success) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">チーム管理</h1>
        </div>
        <div className="p-4 sm:p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg sm:text-xl font-semibold text-red-900 mb-2">
            エラーが発生しました
          </h2>
          <p className="text-sm sm:text-base text-red-700">
            {teamsResult.error || 'チーム情報の取得に失敗しました'}
          </p>
          <Link
            href="/"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const teams = teamsResult.teams;
  const currentTeam = currentTeamResult.team;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">チーム管理</h1>
        <p className="text-sm sm:text-base text-gray-600">
          チームの作成、切り替え、招待リンクの管理ができます
        </p>
      </div>

      {currentTeam && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">現在のチーム</p>
          <p className="text-lg sm:text-xl font-semibold text-blue-900">
            {currentTeam.name}
          </p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            役割: {currentTeam.role === 'owner' ? 'オーナー' : currentTeam.role === 'admin' ? '管理者' : 'メンバー'}
          </p>
        </div>
      )}

      <div className="mb-4 sm:mb-6">
        <TeamCreateDialog />
      </div>

      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">所属チーム一覧</h2>
        {teams && teams.length > 0 ? (
          <TeamList teams={teams} currentTeamId={currentTeam?.id} />
        ) : (
          <div className="p-6 sm:p-8 text-center bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              まだチームに所属していません
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              新しいチームを作成するか、招待リンクから参加してください
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

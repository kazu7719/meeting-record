import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function MinutesListPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login');
  }

  // Fetch minutes list (RLS will ensure only accessible minutes are returned)
  const { data: minutes, error: minutesError } = await supabase
    .from('minutes')
    .select('id, title, meeting_date, created_at')
    .order('created_at', { ascending: false });

  if (minutesError) {
    console.error('Failed to fetch minutes:', minutesError);
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">議事録一覧</h1>
        </div>
        <div className="text-center py-12 text-red-600 dark:text-red-400">
          <p className="mb-4">議事録の取得に失敗しました。</p>
          <p className="text-sm">しばらく経ってから再度お試しください。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">議事録一覧</h1>
        <p className="text-gray-600 dark:text-gray-400">
          保存された議事録を閲覧できます
        </p>
      </div>

      {!minutes || minutes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            議事録がまだありません
          </p>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            トップページで議事録を作成する
          </Link>
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

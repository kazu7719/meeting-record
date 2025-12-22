import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import AudioUploadForm from '@/components/audio-upload-form';

interface MinuteDetailPageProps {
  params: Promise<{ id: string }>;
}

// Generate static params (empty for fully dynamic routes)
export async function generateStaticParams() {
  return [];
}

export default async function MinuteDetailPage({ params }: MinuteDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login');
  }

  // Fetch minute details (RLS will ensure only accessible minutes are returned)
  const { data: minute, error: minuteError } = await supabase
    .from('minutes')
    .select('id, title, raw_text, summary, meeting_date, created_at, updated_at, owner_id')
    .eq('id', id)
    .single();

  if (minuteError || !minute) {
    notFound();
  }

  // Fetch associated audio files
  const { data: audioFiles } = await supabase
    .from('audio_files')
    .select('id, file_path, mime_type, duration, created_at')
    .eq('minute_id', id)
    .order('created_at', { ascending: false });

  // Fetch associated action items
  const { data: actionItems } = await supabase
    .from('action_items')
    .select('id, task_content, assignee_name, due_at, note, evidence, created_at')
    .eq('minute_id', id)
    .order('created_at', { ascending: true });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{minute.title}</h1>
        {minute.meeting_date && (
          <p className="text-gray-600">
            会議日: {new Date(minute.meeting_date).toLocaleDateString('ja-JP')}
          </p>
        )}
        <p className="text-sm text-gray-500">
          作成日: {new Date(minute.created_at).toLocaleString('ja-JP')}
        </p>
      </div>

      {/* Raw Text Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">議事録本文</h2>
        <div className="border rounded-lg p-6 bg-gray-50 whitespace-pre-wrap">
          {minute.raw_text}
        </div>
      </section>

      {/* Summary Section */}
      {minute.summary && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">要約</h2>
          <div className="border rounded-lg p-6 bg-blue-50 whitespace-pre-wrap">
            {minute.summary}
          </div>
        </section>
      )}

      {/* Action Items Section */}
      {actionItems && actionItems.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">アクションプラン</h2>
          <div className="space-y-4">
            {actionItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <h3 className="font-semibold text-lg mb-2">{item.task_content}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-2">
                  <div>
                    <span className="font-medium">担当者:</span>{' '}
                    {item.assignee_name || '未定'}
                  </div>
                  <div>
                    <span className="font-medium">期限:</span>{' '}
                    {item.due_at
                      ? new Date(item.due_at).toLocaleDateString('ja-JP')
                      : '未定'}
                  </div>
                </div>
                {item.note && (
                  <p className="text-sm text-gray-700 mb-2">
                    <span className="font-medium">補足:</span> {item.note}
                  </p>
                )}
                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                    根拠を表示
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 whitespace-pre-wrap">
                    {item.evidence}
                  </div>
                </details>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Audio Files Section */}
      {audioFiles && audioFiles.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">音声ファイル</h2>
          <div className="space-y-2">
            {audioFiles.map((audio) => (
              <div
                key={audio.id}
                className="border rounded-lg p-4 bg-white shadow-sm flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    {audio.file_path.split('/').pop()}
                  </p>
                  <p className="text-sm text-gray-600">
                    アップロード日:{' '}
                    {new Date(audio.created_at).toLocaleString('ja-JP')}
                  </p>
                  {audio.duration && (
                    <p className="text-sm text-gray-600">
                      再生時間: {Math.floor(audio.duration / 60)}分
                      {audio.duration % 60}秒
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Audio Upload Form - Only shown to the owner */}
      {minute.owner_id === user.id && (
        <section className="mb-8">
          <AudioUploadForm minuteId={minute.id} />
        </section>
      )}
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { MinuteDetailAI } from '@/components/minute-detail-ai';

interface MinuteDetailPageProps {
  params: Promise<{ id: string }>;
}

// Force dynamic rendering (no static generation)
export const dynamic = 'force-dynamic';

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

      {/* AI Controls (Summary & Actions) */}
      <MinuteDetailAI
        minuteId={minute.id}
        rawText={minute.raw_text}
        initialSummary={minute.summary}
        initialActionItems={actionItems || []}
        isOwner={minute.owner_id === user.id}
      />
    </div>
  );
}

import { redirect, notFound } from 'next/navigation';
import { MinuteEditForm } from '@/components/minute-edit-form';
import { createClient } from '@/lib/supabase/server';
import { ROUTES } from '@/lib/routes';

interface EditMinutePageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

export default async function EditMinutePage({ params }: EditMinutePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(ROUTES.LOGIN);
  }

  // Fetch minute details (RLS will ensure only accessible minutes are returned)
  const { data: minute, error: minuteError } = await supabase
    .from('minutes')
    .select('id, title, raw_text, meeting_date, owner_id')
    .eq('id', id)
    .single();

  if (minuteError || !minute) {
    notFound();
  }

  // 作成者のみ編集可能（RLSでも制御されるが、UIでも確認）
  if (minute.owner_id !== user.id) {
    redirect(ROUTES.MINUTES_DETAIL(id));
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">議事録編集</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          議事録の内容を編集します
        </p>
      </div>
      <MinuteEditForm
        minuteId={minute.id}
        initialTitle={minute.title}
        initialMeetingDate={minute.meeting_date}
        initialRawText={minute.raw_text}
      />
    </div>
  );
}

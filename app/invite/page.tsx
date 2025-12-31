import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getInvitationByToken } from '@/app/teams/actions';
import InviteAccept from '@/components/invite-accept';

interface InvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function InvitePage({ searchParams }: InvitePageProps) {
  const params = await searchParams;
  const token = params.token;

  if (!token) {
    redirect('/teams');
  }

  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Store token and redirect to login
    redirect(`/login?redirect=/invite?token=${token}`);
  }

  // Fetch invitation details (bypasses RLS using admin client)
  const result = await getInvitationByToken(token);

  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="p-8 text-center bg-red-50 rounded-lg border border-red-200">
          <h1 className="text-2xl font-bold text-red-900 mb-2">
            招待リンクが見つかりません
          </h1>
          <p className="text-red-700 mb-6">
            {result.error || '招待リンクが無効か、すでに削除されています'}
          </p>
          <a
            href="/teams"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            チーム管理に戻る
          </a>
        </div>
      </div>
    );
  }

  const { data: invitation, isExpired, isMaxUsesReached } = result;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <InviteAccept
        token={token}
        teamName={invitation.department.name}
        isExpired={isExpired || false}
        isMaxUsesReached={isMaxUsesReached || false}
      />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
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

  // Fetch invitation details
  const { data: invitation, error } = await supabase
    .from('invitations')
    .select(
      `
      *,
      departments:department_id (
        id,
        name
      )
    `
    )
    .eq('token', token)
    .single();

  if (error || !invitation) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="p-8 text-center bg-red-50 rounded-lg border border-red-200">
          <h1 className="text-2xl font-bold text-red-900 mb-2">
            招待リンクが見つかりません
          </h1>
          <p className="text-red-700 mb-6">
            招待リンクが無効か、すでに削除されています
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

  // Check if expired
  const isExpired = new Date(invitation.expires_at) < new Date();

  // Check if max uses reached
  const isMaxUsesReached =
    invitation.max_uses !== null &&
    invitation.use_count >= invitation.max_uses;

  const department = Array.isArray(invitation.departments)
    ? invitation.departments[0]
    : invitation.departments;

  if (!department) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="p-8 text-center bg-red-50 rounded-lg border border-red-200">
          <h1 className="text-2xl font-bold text-red-900 mb-2">
            エラーが発生しました
          </h1>
          <p className="text-red-700 mb-6">チーム情報が見つかりません</p>
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <InviteAccept
        token={token}
        teamName={department.name}
        isExpired={isExpired}
        isMaxUsesReached={isMaxUsesReached}
      />
    </div>
  );
}

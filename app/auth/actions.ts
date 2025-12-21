'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * profiles自動作成機能
 * Issue 1: 認証設計
 *
 * ログイン/サインアップ後にprofilesレコードが存在しなければ自動作成する
 * - profiles.id = auth.uid()（サーバー側で取得、セキュリティ担保）
 * - department_id = DEFAULT_DEPARTMENT_ID（環境変数）
 */
export async function ensureProfileExists(): Promise<void> {
  const supabase = await createClient();

  // サーバー側で認証状態を取得（セキュリティ担保）
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // 内部情報を露出させない汎用エラーメッセージ
    throw new Error('認証に失敗しました。再度ログインしてください');
  }

  const defaultDepartmentId = process.env.DEFAULT_DEPARTMENT_ID;

  if (!defaultDepartmentId) {
    // 内部設定エラーは開発者向けにログ出力し、ユーザーには汎用メッセージ
    console.error('DEFAULT_DEPARTMENT_ID is not set in environment variables');
    throw new Error('システムエラーが発生しました。管理者にお問い合わせください');
  }

  // Check if profile already exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id) // auth.uid()を使用
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 = "no rows returned" - this is expected when profile doesn't exist
    throw fetchError;
  }

  // If profile doesn't exist, create it
  if (!existingProfile) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id, // auth.uid()を使用
        department_id: defaultDepartmentId,
      });

    if (insertError) {
      throw insertError;
    }
  }
}

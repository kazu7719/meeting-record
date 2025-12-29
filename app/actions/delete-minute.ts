'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * 議事録を削除するServer Action
 * RLSにより、owner_id = auth.uid() の議事録のみ削除可能
 * ON DELETE CASCADE により、関連する action_items, audio_files, ai_jobs も自動削除される
 */
export async function deleteMinute(minuteId: string) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'ログインが必要です',
      };
    }

    // 議事録の存在チェックと所有者確認（Defense in Depth）
    const { data: existingMinute, error: fetchError } = await supabase
      .from('minutes')
      .select('owner_id')
      .eq('id', minuteId)
      .single();

    if (fetchError || !existingMinute) {
      return {
        success: false,
        error: '議事録が見つかりません',
      };
    }

    if (existingMinute.owner_id !== user.id) {
      return {
        success: false,
        error: '削除権限がありません',
      };
    }

    // 議事録を削除（RLSにより owner_id = auth.uid() のもののみ削除可能）
    const { error: deleteError } = await supabase
      .from('minutes')
      .delete()
      .eq('id', minuteId);

    if (deleteError) {
      console.error('Delete minute error:', deleteError);
      return {
        success: false,
        error: '議事録の削除に失敗しました',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Unexpected error in deleteMinute:', error);
    return {
      success: false,
      error: 'エラーが発生しました。しばらく経ってから再度お試しください',
    };
  }
}

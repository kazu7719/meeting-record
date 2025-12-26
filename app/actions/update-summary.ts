'use server';

import { createClient } from '@/lib/supabase/server';

export async function updateSummary(minuteId: string, summary: string) {
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

    // バリデーション
    if (!minuteId) {
      return {
        success: false,
        error: '議事録IDが指定されていません',
      };
    }

    if (!summary || summary.trim() === '') {
      return {
        success: false,
        error: '要約内容が空です',
      };
    }

    // minutes UPDATE（owner_idチェック込み）
    const { error: updateError } = await supabase
      .from('minutes')
      .update({ summary: summary.trim() })
      .eq('id', minuteId)
      .eq('owner_id', user.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      return {
        success: false,
        error: 'データベースへの保存に失敗しました',
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Unexpected error in updateSummary:', error);
    return {
      success: false,
      error: 'エラーが発生しました。しばらく経ってから再度お試しください',
    };
  }
}

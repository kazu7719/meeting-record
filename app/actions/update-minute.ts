'use server';

import { createClient } from '@/lib/supabase/server';

interface UpdateMinuteParams {
  minuteId: string;
  title: string;
  meetingDate: string | null;
  rawText: string;
}

/**
 * 議事録を更新するServer Action
 * RLSにより、owner_id = auth.uid() の議事録のみ更新可能
 */
export async function updateMinute(params: UpdateMinuteParams) {
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
    if (!params.title || params.title.trim() === '') {
      return {
        success: false,
        error: 'タイトルは必須です',
      };
    }

    if (!params.rawText || params.rawText.trim() === '') {
      return {
        success: false,
        error: '議事録本文は必須です',
      };
    }

    if (params.rawText.length > 30000) {
      return {
        success: false,
        error: '議事録本文は30,000文字以下にしてください',
      };
    }

    // 議事録の存在チェックと所有者確認（Defense in Depth）
    const { data: existingMinute, error: fetchError } = await supabase
      .from('minutes')
      .select('owner_id')
      .eq('id', params.minuteId)
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
        error: '編集権限がありません',
      };
    }

    // 議事録を更新（RLSにより owner_id = auth.uid() のもののみ更新可能）
    const { data: minute, error: updateError } = await supabase
      .from('minutes')
      .update({
        title: params.title.trim(),
        meeting_date: params.meetingDate || null,
        raw_text: params.rawText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.minuteId)
      .select('id')
      .single();

    if (updateError || !minute) {
      console.error('Update minute error:', updateError);
      return {
        success: false,
        error: '議事録の更新に失敗しました',
      };
    }

    return {
      success: true,
      minuteId: minute.id,
    };
  } catch (error) {
    console.error('Unexpected error in updateMinute:', error);
    return {
      success: false,
      error: 'エラーが発生しました。しばらく経ってから再度お試しください',
    };
  }
}

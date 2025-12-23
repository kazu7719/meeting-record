'use server';

import { createClient } from '@/lib/supabase/server';

interface SaveMinuteParams {
  title: string;
  meetingDate: string | null;
  rawText: string;
}

export async function saveMinute(params: SaveMinuteParams) {
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
        error: 'raw_textは必須です',
      };
    }

    if (params.rawText.length > 30000) {
      return {
        success: false,
        error: 'raw_textは30,000文字以下にしてください',
      };
    }

    // profilesからdepartment_idを取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('department_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        error: 'プロフィール情報が取得できませんでした',
      };
    }

    // minutes INSERT
    const { data: minute, error: minuteError } = await supabase
      .from('minutes')
      .insert({
        title: params.title.trim(),
        meeting_date: params.meetingDate || null,
        raw_text: params.rawText,
        owner_id: user.id,
        department_id: profile.department_id,
      })
      .select('id')
      .single();

    if (minuteError || !minute) {
      console.error('Database insert error:', minuteError);
      return {
        success: false,
        error: 'データベースへの保存に失敗しました',
      };
    }

    return {
      success: true,
      minuteId: minute.id,
    };
  } catch (error) {
    console.error('Unexpected error in saveMinute:', error);
    return {
      success: false,
      error: 'エラーが発生しました。しばらく経ってから再度お試しください',
    };
  }
}

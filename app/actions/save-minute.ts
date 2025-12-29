'use server';

import { createClient } from '@/lib/supabase/server';

interface ActionItem {
  task_content: string;
  assignee_name: string | null;
  due_at: string | null;
  note: string | null;
  evidence: string;
}

interface SaveMinuteParams {
  title: string;
  meetingDate: string | null;
  rawText: string;
  departmentId: string;
  summary?: string | null;
  actions?: ActionItem[] | null;
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

    // セキュリティ検証：ユーザーが指定されたチームに所属しているか確認
    const { data: membership, error: membershipError } = await supabase
      .from('user_departments')
      .select('department_id')
      .eq('user_id', user.id)
      .eq('department_id', params.departmentId)
      .single();

    if (membershipError || !membership) {
      return {
        success: false,
        error: '指定されたチームに所属していません',
      };
    }

    // minutes INSERT
    const { data: minute, error: minuteError } = await supabase
      .from('minutes')
      .insert({
        title: params.title.trim(),
        meeting_date: params.meetingDate || null,
        raw_text: params.rawText,
        summary: params.summary || null,
        owner_id: user.id,
        department_id: params.departmentId,
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

    // action_items INSERT（存在する場合）
    if (params.actions && params.actions.length > 0) {
      const { error: actionsError } = await supabase
        .from('action_items')
        .insert(
          params.actions.map((action) => ({
            minute_id: minute.id,
            task_content: action.task_content,
            assignee_name: action.assignee_name,
            due_at: action.due_at,
            note: action.note,
            evidence: action.evidence,
          }))
        );

      if (actionsError) {
        // action_items の保存に失敗してもminutes自体は保存成功
        console.error('action_items insert error:', actionsError);
      }
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

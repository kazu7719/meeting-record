'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionItem } from './extract-actions';

interface SaveActionsInput {
  minuteId: string;
  actions: ActionItem[];
}

interface SaveActionsResult {
  success: boolean;
  error?: string;
  savedCount?: number;
}

/**
 * アクション項目保存Server Action
 * Issue 8: ログイン後のaction_items保存機能
 *
 * @param input minuteId + アクション配列
 * @returns 成功時は保存件数、失敗時はエラーメッセージ
 */
export async function saveActions(
  input: SaveActionsInput
): Promise<SaveActionsResult> {
  const { minuteId, actions } = input;

  // 1. 入力バリデーション
  if (!minuteId || minuteId.trim().length === 0) {
    return {
      success: false,
      error: '議事録IDが指定されていません',
    };
  }

  if (!actions || actions.length === 0) {
    return {
      success: false,
      error: '保存するアクション項目がありません',
    };
  }

  // 2. ログイン認証チェック
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'ログインが必要です',
    };
  }

  try {
    // 3. minuteの存在確認（owner_id=自分のminuteであることも確認）
    const { data: minute, error: minuteError } = await supabase
      .from('minutes')
      .select('id, owner_id')
      .eq('id', minuteId)
      .single();

    if (minuteError || !minute) {
      return {
        success: false,
        error: '指定された議事録が見つかりません',
      };
    }

    if (minute.owner_id !== user.id) {
      return {
        success: false,
        error: '他のユーザーの議事録にはアクションを保存できません',
      };
    }

    // 4. 既存のaction_itemsを削除（上書き保存）
    const { error: deleteError } = await supabase
      .from('action_items')
      .delete()
      .eq('minute_id', minuteId);

    if (deleteError) {
      console.error('Delete action_items error:', deleteError);
      return {
        success: false,
        error: 'アクション項目の削除に失敗しました',
      };
    }

    // 5. action_itemsへの一括INSERT
    const insertData = actions.map((action) => ({
      minute_id: minuteId,
      task_content: action.task_content,
      assignee_name: action.assignee_name,
      due_at: action.due_at,
      note: action.note,
      evidence: action.evidence,
    }));

    const { error: insertError } = await supabase
      .from('action_items')
      .insert(insertData);

    if (insertError) {
      console.error('Insert action_items error:', insertError);
      return {
        success: false,
        error: 'アクション項目の保存に失敗しました',
      };
    }

    return {
      success: true,
      savedCount: actions.length,
    };
  } catch (error) {
    console.error('Save actions error:', error);
    return {
      success: false,
      error: 'エラーが発生しました。しばらく経ってから再度お試しください',
    };
  }
}

/**
 * ログインユーザーの最新minuteを取得
 * 未保存時の誘導に使用
 */
export async function getLatestMinute(): Promise<{
  success: boolean;
  minuteId?: string;
  title?: string;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: 'ログインが必要です',
    };
  }

  try {
    const { data: minute, error: minuteError } = await supabase
      .from('minutes')
      .select('id, title')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (minuteError || !minute) {
      return {
        success: false,
        error: '保存済みの議事録がありません',
      };
    }

    return {
      success: true,
      minuteId: minute.id,
      title: minute.title,
    };
  } catch (error) {
    console.error('Get latest minute error:', error);
    return {
      success: false,
      error: 'エラーが発生しました',
    };
  }
}

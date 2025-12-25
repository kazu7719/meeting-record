'use server';

import {
  getGeminiClient,
  getActionExtractionPrompt,
} from '@/lib/gemini/client';
import {
  generateCacheKey,
  getCached,
  setCache,
} from '@/lib/cache/simple-cache';
import { getOrCreateGuestId } from '@/lib/rate-limit/guest-id';
import {
  checkRateLimit,
  incrementRateLimit,
} from '@/lib/rate-limit/rate-limiter';
import { checkDebounce, updateDebounce } from '@/lib/rate-limit/debounce';

/**
 * アクション項目の型定義
 * Issue 8: 固定フォーマット（この形以外は失敗扱い）
 */
export interface ActionItem {
  task_content: string;
  assignee_name: string | null;
  due_at: string | null;
  note: string | null;
  evidence: string;
}

interface ExtractActionsInput {
  rawText: string;
}

interface ExtractActionsResult {
  success: boolean;
  actions?: ActionItem[];
  error?: string;
}

/**
 * アクション抽出Server Action
 * Issue 8: AIアクション抽出（Gemini / ゲストOK / 根拠必須）
 *
 * @param input raw_text
 * @returns 成功時はアクション配列、失敗時はエラーメッセージ
 */
export async function extractActions(
  input: ExtractActionsInput
): Promise<ExtractActionsResult> {
  const { rawText } = input;

  // 1. 入力バリデーション
  if (!rawText || rawText.trim().length === 0) {
    return {
      success: false,
      error: '議事録テキストを入力してください',
    };
  }

  const maxChars = parseInt(process.env.AI_RAW_TEXT_MAX_CHARS || '30000', 10);
  if (rawText.length > maxChars) {
    return {
      success: false,
      error: `入力は${maxChars.toLocaleString()}文字以下にしてください`,
    };
  }

  // 2. guest_id取得
  const guestId = await getOrCreateGuestId();

  // 3. レート制限チェック
  const limitPerDay = parseInt(process.env.AI_RATE_LIMIT_PER_DAY || '10', 10);
  if (!checkRateLimit(guestId, limitPerDay)) {
    return {
      success: false,
      error: `利用回数の上限（1日${limitPerDay}回）に達しました。しばらく経ってから再度お試しください`,
    };
  }

  // 4. デバウンスチェック（連打防止）
  const debounceSeconds = parseInt(process.env.AI_DEBOUNCE_SECONDS || '30', 10);
  if (!checkDebounce(guestId, debounceSeconds)) {
    return {
      success: false,
      error: `短時間での連続実行は制限されています。${debounceSeconds}秒後に再度お試しください`,
    };
  }

  // 5. キャッシュチェック
  const cacheKey = generateCacheKey(rawText + ':action');
  const cached = getCached(cacheKey);
  if (cached) {
    try {
      const actions = JSON.parse(cached);
      // キャッシュからの復元時も必須キー検証
      if (!validateActions(actions)) {
        // キャッシュが不正な場合は削除して再生成
        // （本来起こらないが安全のため）
      } else {
        return {
          success: true,
          actions,
        };
      }
    } catch {
      // パース失敗時はキャッシュを無視して再生成
    }
  }

  // 6. Gemini API実行
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = getActionExtractionPrompt(rawText);
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // マークダウンのコードブロックを除去（```json ... ``` を除去）
    responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // 7. JSON parse & 必須キー検証
    let actions: ActionItem[];
    try {
      actions = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', responseText);
      return {
        success: false,
        error: 'アクション抽出に失敗しました。もう一度お試しください',
      };
    }

    // 配列チェック
    if (!Array.isArray(actions)) {
      return {
        success: false,
        error: 'アクション抽出に失敗しました。もう一度お試しください',
      };
    }

    // 必須キー検証
    if (!validateActions(actions)) {
      return {
        success: false,
        error: 'アクション抽出に失敗しました。もう一度お試しください',
      };
    }

    // 8. キャッシュに保存
    const cacheTTL = parseInt(process.env.AI_CACHE_TTL_SECONDS || '86400', 10);
    setCache(cacheKey, JSON.stringify(actions), cacheTTL);

    // 9. レート制限カウンターを更新
    incrementRateLimit(guestId);

    // 10. デバウンスタイムスタンプを更新
    updateDebounce(guestId);

    return {
      success: true,
      actions,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      success: false,
      error: 'エラーが発生しました。しばらく経ってから再度お試しください',
    };
  }
}

/**
 * アクション配列の必須キー検証
 * @param actions 検証対象配列
 * @returns 全てのアクション項目が必須キーを持っていればtrue
 */
function validateActions(actions: unknown): actions is ActionItem[] {
  if (!Array.isArray(actions)) {
    return false;
  }

  const requiredKeys = [
    'task_content',
    'assignee_name',
    'due_at',
    'note',
    'evidence',
  ];

  for (const action of actions) {
    if (typeof action !== 'object' || action === null) {
      return false;
    }

    for (const key of requiredKeys) {
      if (!(key in action)) {
        return false;
      }
    }

    const typedAction = action as Record<string, unknown>;

    // evidenceは必須（空文字禁止）
    if (
      typeof typedAction.evidence !== 'string' ||
      typedAction.evidence.trim().length === 0
    ) {
      return false;
    }

    // task_contentも必須（空文字禁止）
    if (
      typeof typedAction.task_content !== 'string' ||
      typedAction.task_content.trim().length === 0
    ) {
      return false;
    }

    // assignee_name, due_at, noteはstring | null
    const nullableFields = ['assignee_name', 'due_at', 'note'];
    for (const field of nullableFields) {
      const value = typedAction[field];
      if (value !== null && typeof value !== 'string') {
        return false;
      }
    }
  }

  return true;
}

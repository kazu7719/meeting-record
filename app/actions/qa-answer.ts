'use server';

import { getGeminiClient, getQAPrompt } from '@/lib/gemini/client';
import { generateCacheKey, getCached, setCache } from '@/lib/cache/simple-cache';
import { getOrCreateGuestId } from '@/lib/rate-limit/guest-id';
import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limit/rate-limiter';
import { checkDebounce, updateDebounce } from '@/lib/rate-limit/debounce';

/**
 * AI QA Server Action
 * Issue 9: AI QA（根拠必須 / 記載がありません規定）
 *
 * ゲストでも実行可能
 * レート制限・キャッシュ・デバウンス機構を実装
 */

export interface QAResult {
  answer: string;
  evidence: string;
}

interface ExecuteQAInput {
  rawText: string;
  question: string;
}

interface ExecuteQAResult {
  success: boolean;
  result?: QAResult;
  error?: string;
}

export async function executeQA(
  input: ExecuteQAInput
): Promise<ExecuteQAResult> {
  const { rawText, question } = input;

  // 1. 入力バリデーション（raw_text）
  if (!rawText || rawText.trim().length === 0) {
    return {
      success: false,
      error: '議事録テキストを入力してください',
    };
  }

  const maxRawTextChars = parseInt(process.env.AI_RAW_TEXT_MAX_CHARS || '30000', 10);
  if (rawText.length > maxRawTextChars) {
    return {
      success: false,
      error: `議事録は${maxRawTextChars.toLocaleString()}文字以下にしてください`,
    };
  }

  // 2. 入力バリデーション（question）
  if (!question || question.trim().length === 0) {
    return {
      success: false,
      error: '質問を入力してください',
    };
  }

  const maxQuestionChars = parseInt(process.env.AI_QUESTION_MAX_CHARS || '800', 10);
  if (question.length > maxQuestionChars) {
    return {
      success: false,
      error: `質問は${maxQuestionChars}文字以下にしてください`,
    };
  }

  // 3. guest_id取得
  const guestId = await getOrCreateGuestId();

  // 4. レート制限チェック
  const limitPerDay = parseInt(process.env.AI_RATE_LIMIT_PER_DAY || '10', 10);
  if (!checkRateLimit(guestId, limitPerDay)) {
    return {
      success: false,
      error: `利用回数の上限（1日${limitPerDay}回）に達しました。しばらく経ってから再度お試しください`,
    };
  }

  // 5. デバウンスチェック（連打防止）
  const debounceSeconds = parseInt(process.env.AI_DEBOUNCE_SECONDS || '30', 10);
  if (!checkDebounce(guestId, debounceSeconds)) {
    return {
      success: false,
      error: `短時間での連続実行は制限されています。${debounceSeconds}秒後に再度お試しください`,
    };
  }

  // 6. キャッシュチェック（key: sha256(raw_text + question)）
  const cacheKey = generateCacheKey(rawText + question);
  const cached = getCached(cacheKey);
  if (cached) {
    try {
      const result = JSON.parse(cached);
      if (validateQAResult(result)) {
        return {
          success: true,
          result,
        };
      }
      // キャッシュが不正な場合は無視して再生成
    } catch {
      // パース失敗時はキャッシュを無視して再生成
    }
  }

  // 7. Gemini API実行
  try {
    // APIキーチェック
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = getQAPrompt(rawText, question);
    const apiResult = await model.generateContent(prompt);
    const responseText = apiResult.response.text();

    // 8. JSON parse & バリデーション
    let qaResult: QAResult;
    try {
      qaResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return {
        success: false,
        error: 'QA処理に失敗しました。もう一度お試しください（JSON形式エラー）',
      };
    }

    // 9. 必須キー検証
    if (!validateQAResult(qaResult)) {
      return {
        success: false,
        error: 'QA処理に失敗しました。もう一度お試しください（必須キー不足）',
      };
    }

    // 10. キャッシュに保存
    const cacheTTL = parseInt(process.env.AI_CACHE_TTL_SECONDS || '86400', 10);
    setCache(cacheKey, JSON.stringify(qaResult), cacheTTL);

    // 11. レート制限カウンターを更新
    incrementRateLimit(guestId);

    // 12. デバウンスタイムスタンプを更新
    updateDebounce(guestId);

    return {
      success: true,
      result: qaResult,
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
 * QA結果のバリデーション
 * @param result バリデーション対象
 * @returns 有効な場合true
 */
function validateQAResult(result: unknown): result is QAResult {
  if (typeof result !== 'object' || result === null) {
    return false;
  }

  const typedResult = result as Record<string, unknown>;

  // answer必須（空文字禁止）
  if (
    typeof typedResult.answer !== 'string' ||
    typedResult.answer.trim().length === 0
  ) {
    return false;
  }

  // evidence必須（空文字禁止）
  if (
    typeof typedResult.evidence !== 'string' ||
    typedResult.evidence.trim().length === 0
  ) {
    return false;
  }

  return true;
}

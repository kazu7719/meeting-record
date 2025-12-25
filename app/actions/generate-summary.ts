'use server';

import { getGeminiClient, getSummaryPrompt } from '@/lib/gemini/client';
import { generateCacheKey, getCached, setCache } from '@/lib/cache/simple-cache';
import { getOrCreateGuestId } from '@/lib/rate-limit/guest-id';
import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limit/rate-limiter';
import { checkDebounce, updateDebounce } from '@/lib/rate-limit/debounce';

/**
 * AI要約生成 Server Action
 * Issue 7: AI要約（Gemini / ゲストOK / 保存はログイン後）
 *
 * ゲストでも実行可能
 * レート制限・キャッシュ・デバウンス機構を実装
 */

interface GenerateSummaryInput {
  rawText: string;
}

interface GenerateSummaryResult {
  success: boolean;
  summary?: string;
  error?: string;
}

export async function generateSummary(
  input: GenerateSummaryInput
): Promise<GenerateSummaryResult> {
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
  const cacheKey = generateCacheKey(rawText);
  const cached = getCached(cacheKey);
  if (cached) {
    // キャッシュヒット（Geminiを呼ばない）
    return {
      success: true,
      summary: cached,
    };
  }

  // 6. Gemini API実行
  try {
    // APIキーチェック
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = getSummaryPrompt(rawText);
    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    // 7. キャッシュに保存
    const cacheTTL = parseInt(process.env.AI_CACHE_TTL_SECONDS || '86400', 10);
    setCache(cacheKey, summary, cacheTTL);

    // 8. レート制限カウンターを更新
    incrementRateLimit(guestId);

    // 9. デバウンスタイムスタンプを更新
    updateDebounce(guestId);

    return {
      success: true,
      summary,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      success: false,
      error: 'エラーが発生しました。しばらく経ってから再度お試しください',
    };
  }
}

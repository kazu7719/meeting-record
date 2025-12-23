/**
 * レート制限機構
 * Issue 7, 8, 9: AI実行のレート制限
 *
 * guest_id + 日付をキーとして、日次実行回数を制限
 */

interface RateLimitEntry {
  count: number;
  date: string; // YYYY-MM-DD
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// クリーンアップの最終実行時刻（メモリリーク防止）
let lastCleanup = 0;
const CLEANUP_INTERVAL = 3600000; // 1時間

/**
 * 今日の日付を取得（YYYY-MM-DD形式）
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * 古いエントリをクリーンアップ（メモリリーク防止）
 */
function cleanupOldEntries(): void {
  const now = Date.now();

  // 前回のクリーンアップから一定時間経過していなければスキップ
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  const today = getTodayString();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.date !== today) {
      rateLimitStore.delete(key);
    }
  }

  lastCleanup = now;
}

/**
 * レート制限をチェック
 * @param guestId ゲストID
 * @param limitPerDay 1日の上限回数
 * @returns レート制限に引っかかっていない場合true
 */
export function checkRateLimit(guestId: string, limitPerDay: number): boolean {
  // 定期的にクリーンアップを実行
  cleanupOldEntries();

  const today = getTodayString();
  const key = `${guestId}:${today}`;

  const entry = rateLimitStore.get(key);

  if (!entry) {
    // 初回実行
    return true;
  }

  // 日付が変わっていればリセット
  if (entry.date !== today) {
    rateLimitStore.delete(key);
    return true;
  }

  // 上限チェック
  return entry.count < limitPerDay;
}

/**
 * レート制限カウンターをインクリメント
 * @param guestId ゲストID
 */
export function incrementRateLimit(guestId: string): void {
  const today = getTodayString();
  const key = `${guestId}:${today}`;

  const entry = rateLimitStore.get(key);

  if (!entry || entry.date !== today) {
    rateLimitStore.set(key, { count: 1, date: today });
  } else {
    entry.count += 1;
    rateLimitStore.set(key, entry);
  }
}

import crypto from 'crypto';

/**
 * シンプルなインメモリキャッシュ
 * Issue 7, 8, 9: AI結果のキャッシュ
 *
 * MVP用途: プロセスごとにキャッシュを保持
 * 将来的にはRedisなどの外部キャッシュに切り替え可能
 */

interface CacheEntry {
  value: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

// クリーンアップの最終実行時刻（メモリリーク防止）
let lastCleanup = 0;
const CLEANUP_INTERVAL = 60000; // 1分

/**
 * SHA256ハッシュでキャッシュキーを生成
 */
export function generateCacheKey(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * 期限切れエントリをクリーンアップ（メモリリーク防止）
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();

  // 前回のクリーンアップから一定時間経過していなければスキップ
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }

  lastCleanup = now;
}

/**
 * キャッシュから値を取得
 * @returns キャッシュヒット時は値、ミス時はnull
 */
export function getCached(key: string): string | null {
  // 定期的にクリーンアップを実行
  cleanupExpiredEntries();

  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  // 有効期限チェック
  const now = Date.now();
  if (now > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * キャッシュに値を保存
 * @param key キャッシュキー
 * @param value 保存する値
 * @param ttlSeconds TTL（秒）
 */
export function setCache(key: string, value: string, ttlSeconds: number): void {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  cache.set(key, { value, expiresAt });
}

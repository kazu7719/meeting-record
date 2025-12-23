/**
 * デバウンス（連打防止）機構
 * Issue 7, 8, 9: AI実行の連打防止
 *
 * 短時間（10-30秒）以内の連続実行を拒否
 */

interface DebounceEntry {
  lastExecutionTime: number;
}

const debounceStore = new Map<string, DebounceEntry>();

// クリーンアップの最終実行時刻（メモリリーク防止）
let lastCleanup = 0;
const CLEANUP_INTERVAL = 600000; // 10分

/**
 * 古いエントリをクリーンアップ（メモリリーク防止）
 */
function cleanupOldEntries(): void {
  const now = Date.now();

  // 前回のクリーンアップから一定時間経過していなければスキップ
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return;
  }

  const maxAge = 3600000; // 1時間以上古いエントリは削除
  for (const [key, entry] of debounceStore.entries()) {
    if (now - entry.lastExecutionTime > maxAge) {
      debounceStore.delete(key);
    }
  }

  lastCleanup = now;
}

/**
 * デバウンスチェック
 * @param key デバウンスキー（guest_id等）
 * @param debounceSeconds デバウンス秒数
 * @returns デバウンス期間が経過していればtrue
 */
export function checkDebounce(key: string, debounceSeconds: number): boolean {
  // 定期的にクリーンアップを実行
  cleanupOldEntries();

  const entry = debounceStore.get(key);

  if (!entry) {
    return true;
  }

  const now = Date.now();
  const elapsedSeconds = (now - entry.lastExecutionTime) / 1000;

  return elapsedSeconds >= debounceSeconds;
}

/**
 * デバウンスタイムスタンプを更新
 * @param key デバウンスキー
 */
export function updateDebounce(key: string): void {
  debounceStore.set(key, { lastExecutionTime: Date.now() });
}

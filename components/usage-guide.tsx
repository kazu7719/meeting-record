/**
 * 使い方・注意事項コンポーネント
 * Issue 33: トップページへ使い方・注意事項を記載
 */
export function UsageGuide() {
  return (
    <div className="mb-6 p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">
        使い方
      </h2>
      <ol className="list-decimal list-inside space-y-2 text-sm sm:text-base text-blue-800 dark:text-blue-200 mb-6">
        <li>チームを作成、または招待リンクからチームに参加します</li>
        <li>
          スマホなどで録音した音声を、ChatGPTやGeminiなどの文字起こし対応AIサービスで文字起こしし、そのテキストを貼り付けます
        </li>
        <li>議事録を保存します</li>
      </ol>

      <div className="mb-6 p-3 sm:p-4 bg-white dark:bg-gray-800 rounded border border-blue-100 dark:border-blue-700">
        <h3 className="text-sm sm:text-base font-semibold mb-2 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="補足">
            💡
          </span>
          <span>補足</span>
        </h3>
        <ul className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
          <li>要約とアクションプランは、保存後の議事録画面で各ボタンを押すことで生成されます</li>
          <li>議事録一覧には、チーム管理で「現在のチーム」に選択したチームの議事録が表示されます</li>
          <li>別のチームの議事録を見たい場合は、チーム管理でチームを切り替えてください</li>
        </ul>
      </div>

      <div className="p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
        <h3 className="text-sm sm:text-base font-semibold mb-2 text-amber-900 dark:text-amber-100 flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="注意">
            ⚠️
          </span>
          <span>注意</span>
        </h3>
        <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-200">
          要約・アクションプランの生成、編集、削除は議事録の作成者のみが行えます
        </p>
      </div>
    </div>
  );
}

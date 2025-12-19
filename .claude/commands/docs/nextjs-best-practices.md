# Next.js コーディング規約 (レビュー基準)

## CP-01: コンポーネント設計 (Component)
- **Server Components優先**: デフォルトはServer Componentsとし、インタラクティブな操作が必要な場合のみClient Componentsを使用すること。
- **'use client'の最小化**: 'use client'ディレクティブは必要最小限のコンポーネントにのみ付与し、親コンポーネントへの伝播を避けること。
- **単一責任原則**: 各コンポーネントは1つの明確な責任のみを持つこと。複雑なコンポーネントは、より小さな責任に分割すること。
- **Props の型定義**: すべてのコンポーネントの props は TypeScript の interface または type で明示的に定義すること。

## DF-01: データフェッチング (Data Fetching)
- **キャッシング戦略**: fetch API 使用時は、適切なキャッシング戦略（`{ cache: 'force-cache' | 'no-store' }` または `{ next: { revalidate: number } }`）を明示的に指定すること。
- **Server Actions**: データの変更操作には Server Actions を使用し、'use server' ディレクティブを付与すること。
- **Supabase SSR**: Supabase クライアントは必ず `@supabase/ssr` を使用し、Server Components では `createServerClient`、Client Components では `createBrowserClient` を使用すること。
- **エラーハンドリング**: すべてのデータフェッチには適切なエラーハンドリングを実装し、error.tsx または try-catch でユーザーフレンドリーなエラー表示を提供すること。
- **ローディング状態**: 非同期処理には loading.tsx または Suspense を使用し、適切なローディング UI を表示すること。

## TS-01: 型安全性 (TypeScript)
- **Strict モード**: `tsconfig.json` の strict モードを有効にし、すべての型エラーを解決すること。
- **明示的な型定義**: 変数、関数の引数、戻り値には明示的に型を定義すること。型推論に頼りすぎないこと。
- **any の禁止**: `any` 型の使用は原則禁止。やむを得ない場合は `unknown` を使用し、型ガードで安全性を確保すること。
- **Supabase Database 型**: Supabase の型生成機能を活用し、`Database` 型を import して使用すること。
- **Null 安全性**: Optional Chaining (`?.`) および Nullish Coalescing (`??`) を活用し、null/undefined による実行時エラーを防ぐこと。

## PF-01: パフォーマンス (Performance)
- **動的インポート**: 大きなコンポーネントやライブラリは `next/dynamic` を使用して遅延ロード（Code Splitting）を行うこと。
- **画像最適化**: 画像は必ず `next/image` の `Image` コンポーネントを使用し、width/height を指定すること。
- **再レンダリング最適化**: 不要な再レンダリングを防ぐため、`React.memo`、`useMemo`、`useCallback` を適切に使用すること。ただし、過度な最適化は避けること。
- **バンドルサイズ**: 依存ライブラリのサイズを意識し、tree-shaking が効くライブラリを選択すること。
- **メタデータの最適化**: `metadata` API または `generateMetadata` を使用し、SEO とパフォーマンスを最適化すること。

## SC-01: セキュリティ (Security)
- **環境変数の管理**: クライアント側で使用する環境変数には `NEXT_PUBLIC_` プレフィックスを付与すること。サーバー専用の機密情報（API キーなど）には付与しないこと。
- **XSS 対策**: ユーザー入力を表示する際は、React のデフォルトのエスケープに依存し、`dangerouslySetInnerHTML` は避けること。やむを得ない場合は DOMPurify でサニタイズすること。
- **RLS の活用**: Supabase の Row Level Security (RLS) を有効にし、データベースレベルでアクセス制御を実装すること。
- **CSRF 対策**: Server Actions は自動的に CSRF 対策が適用されるが、外部 API 呼び出しには適切な認証トークンを使用すること。
- **認証状態の検証**: サーバー側で必ず認証状態を検証し、クライアント側の認証情報のみに依存しないこと。

## RT-01: ルーティングとレイアウト (Routing)
- **ファイル規約の遵守**: App Router のファイル命名規約（`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`）を厳密に遵守すること。
- **Layout の活用**: 共通レイアウトは `layout.tsx` で定義し、ページ間でのレイアウトの再利用とネストを活用すること。
- **Route Groups**: 関連するルートは Route Groups (`(folder-name)`) でグループ化し、URL に影響を与えずに論理的に整理すること。
- **動的ルート**: 動的ルートは `[id]` または `[...slug]` の形式で定義し、`params` プロパティで安全にアクセスすること。
- **リダイレクト**: リダイレクトは `redirect()` 関数または `next.config.ts` の `redirects` を使用し、ハードコードされた URL は避けること。

## ST-01: スタイリング (Styling)
- **Tailwind CSS の活用**: スタイリングは Tailwind CSS のユーティリティクラスを優先すること。
- **CSS Modules の制限**: グローバルスタイルは `globals.css` のみとし、コンポーネント固有のスタイルは Tailwind で実装すること。
- **cn ヘルパーの使用**: 条件付きクラス名の結合には `cn()` ヘルパー（clsx + tailwind-merge）を使用すること。
- **CSS 変数**: テーマカラーなどは CSS 変数（`--variable-name`）として定義し、Tailwind の設定で参照すること。
- **レスポンシブデザイン**: Tailwind のレスポンシブプレフィックス（`sm:`, `md:`, `lg:`）を使用し、モバイルファーストで設計すること。

## AC-01: アクセシビリティ (Accessibility)
- **セマンティック HTML**: 適切な HTML タグ（`<button>`, `<nav>`, `<main>`, `<article>` など）を使用すること。
- **ARIA 属性**: 必要に応じて ARIA 属性（`aria-label`, `aria-describedby` など）を追加し、スクリーンリーダー対応を行うこと。
- **キーボード操作**: すべてのインタラクティブ要素はキーボードで操作可能であること。`tabIndex` を適切に設定すること。
- **フォーカス管理**: フォーカス可能な要素には視覚的なフォーカスインジケーターを提供すること。
- **alt テキスト**: すべての画像には適切な `alt` 属性を設定すること。装飾画像には空文字列を設定すること。

## TE-01: テスト (Testing)
- **振る舞いテスト**: テストは実装の詳細ではなく、ユーザーの視点から**振る舞い**をテストすること。
- **Testing Library**: コンポーネントのテストには `@testing-library/react` を使用し、`getByRole`, `getByLabelText` などのアクセシビリティ重視のクエリを優先すること。
- **テスト名**: テストケースには明確で説明的な名前を付け、期待される動作を説明すること（例: `it('should display error message when form submission fails', ...)`）。
- **モック**: 外部依存（API、Supabase など）は適切にモックし、テストの独立性を確保すること。
- **カバレッジ**: 重要なビジネスロジックとユーザーインタラクションは必ずテストでカバーすること。

## ER-01: エラーハンドリング (Error Handling)
- **エラー境界**: error.tsx を使用してエラー境界を設定し、予期しないエラーをキャッチすること。
- **ユーザーフレンドリー**: エラーメッセージはユーザーにわかりやすく、次のアクションを示唆する内容にすること。
- **ログ記録**: 本番環境でのエラーは適切にログ記録し、監視ツール（Sentry など）と統合すること。
- **フォールバック UI**: エラー時には必ずフォールバック UI を表示し、アプリケーション全体のクラッシュを防ぐこと。

# プロジェクト構造

## ディレクトリ構成

```
.
├── app/                    # Next.js App Router
│   ├── auth/              # 認証関連ページ
│   │   ├── login/         # ログインページ
│   │   ├── sign-up/       # サインアップページ
│   │   ├── sign-up-success/ # サインアップ成功ページ
│   │   ├── forgot-password/ # パスワードリセットページ
│   │   ├── update-password/ # パスワード更新ページ
│   │   ├── confirm/       # メール確認ルート
│   │   └── error/         # エラーページ
│   ├── protected/         # 認証が必要なページ
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # ホームページ
│   └── globals.css        # グローバルスタイル
│
├── components/            # Reactコンポーネント
│   ├── ui/               # shadcn/ui コンポーネント
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── checkbox.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── badge.tsx
│   ├── tutorial/         # チュートリアル関連コンポーネント
│   ├── auth-button.tsx
│   ├── login-form.tsx
│   ├── sign-up-form.tsx
│   ├── logout-button.tsx
│   ├── forgot-password-form.tsx
│   ├── update-password-form.tsx
│   ├── theme-switcher.tsx
│   └── ...
│
├── lib/                   # ユーティリティ関数
│   ├── test/             # テストヘルパー
│   │   └── helpers.ts    # テストデータ生成関数
│   ├── supabase/         # Supabase関連
│   │   ├── client.ts     # クライアント用
│   │   ├── server.ts     # サーバー用
│   │   └── proxy.ts      # プロキシ設定
│   └── utils.ts          # 汎用ユーティリティ
│
├── __tests__/            # テストファイル (RSpecのspec/に相当)
│   ├── Home.test.tsx
│   └── utils/
│
├── public/               # 静的ファイル
├── node_modules/         # 依存パッケージ
├── .next/                # Next.jsビルド出力
├── .git/                 # Gitリポジトリ
├── .claude/              # Claude Code設定
├── .serena/              # Serena MCP設定
│
├── package.json          # プロジェクト設定・依存関係
├── tsconfig.json         # TypeScript設定
├── jest.config.ts        # Jest設定
├── jest.setup.ts         # Jestセットアップ
├── eslint.config.mjs     # ESLint設定
├── tailwind.config.ts    # Tailwind CSS設定
├── postcss.config.mjs    # PostCSS設定
├── next.config.ts        # Next.js設定
├── components.json       # shadcn/ui設定
├── .env.example          # 環境変数のサンプル
├── .env.local            # 環境変数 (gitignore)
└── README.md             # プロジェクトドキュメント
```

## 主要ファイルの役割

### アプリケーションエントリーポイント
- `app/page.tsx`: ホームページ
- `app/layout.tsx`: ルートレイアウト（全ページ共通）
- `app/protected/page.tsx`: 認証が必要なページの例

### 設定ファイル
- `next.config.ts`: Next.jsの設定
- `tsconfig.json`: TypeScriptコンパイラ設定
- `tailwind.config.ts`: Tailwindテーマとカラー設定
- `components.json`: shadcn/ui設定（New Yorkスタイル）

### テスト関連
- `jest.config.ts`: Jestの設定（jsdom環境、パスエイリアス）
- `jest.setup.ts`: テスト実行前のセットアップ
- `lib/test/helpers.ts`: FactoryBot相当のテストヘルパー

## ファイル命名規則
- コンポーネント: kebab-case (`login-form.tsx`)
- テスト: `*.test.tsx` または `*.spec.tsx`
- ページ: `page.tsx` (App Router規約)
- レイアウト: `layout.tsx` (App Router規約)
- ルートハンドラ: `route.ts` (App Router規約)

## パスエイリアス
- `@/*`: プロジェクトルートを参照
- 例: `@/components/ui/button`, `@/lib/utils`

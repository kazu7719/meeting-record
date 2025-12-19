# 技術スタック

## フロントエンド
- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript (Strict mode有効)
- **UIライブラリ**: React 19
- **スタイリング**: 
  - Tailwind CSS (CSS-in-JS使用)
  - tailwindcss-animate
  - CSS変数を使用したテーマシステム
- **UIコンポーネント**: 
  - Radix UI (@radix-ui/react-*)
  - shadcn/ui (New York style)
  - Lucide React (アイコン)

## バックエンド
- **BaaS**: Supabase
  - @supabase/supabase-js
  - @supabase/ssr (SSR対応)

## テスト
- **フレームワーク**: Jest 30
- **環境**: jsdom
- **ツール**: 
  - @testing-library/react 16
  - @testing-library/jest-dom
  - @testing-library/user-event
  - ts-jest

## 開発ツール
- **リンター**: ESLint 9 (Next.js標準設定)
- **パッケージマネージャー**: npm
- **型チェック**: TypeScript 5

## ユーティリティ
- class-variance-authority (スタイルバリアント管理)
- clsx (クラス名条件付き結合)
- tailwind-merge (Tailwindクラス名のマージ)
- next-themes (テーマ管理)

## 開発環境
- Node.js 20+
- macOS (Darwin)

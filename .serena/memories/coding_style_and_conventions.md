# コーディングスタイルと規約

## TypeScript設定
- **Strictモード**: 有効
- **Target**: ES2017
- **Module**: ESNext (Bundler resolution)
- **JSX**: react-jsx
- **パスエイリアス**: `@/*` でプロジェクトルートを参照

## ファイル命名規則
- コンポーネントファイル: kebab-case (例: `login-form.tsx`)
- テストファイル: `*.test.tsx` または `*.spec.tsx`
- 設定ファイル: kebab-case (例: `jest.config.ts`)

## コンポーネント構造
- **React Server Components (RSC)**: デフォルトでサーバーコンポーネント
- **Client Components**: 必要な場合のみ `'use client'` ディレクティブ使用
- **shadcn/ui**: New Yorkスタイル

## スタイリング規約
- Tailwind CSSクラスを使用
- CSS変数を使用したテーマシステム (`hsl(var(--*))`)
- ダークモード: クラスベース (`darkMode: ["class"]`)
- コンポーネントバリアント: class-variance-authority使用

## テスト規約
- **テストフレームワーク**: Jest (RSpecスタイル)
- **テストヘルパー**: `lib/test/helpers.ts` (FactoryBot相当)
- **テストファイル配置**: `__tests__/` ディレクトリ
- **テストデータ生成**: `buildMeeting()`, `buildUser()` などのヘルパー関数
- **テスト構造**: 
  - `describe` ブロックでグループ化
  - `it` でテストケース定義
  - React Testing Libraryを使用してDOM操作

### テストの書き方例
```typescript
import { render, screen } from '@testing-library/react'
import { buildMeeting } from '@/lib/test/helpers'

describe('Component', () => {
  it('renders correctly', () => {
    const meeting = buildMeeting({ title: 'Test' })
    render(<Component meeting={meeting} />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})
```

## コメント規約
- 日本語でのコメント可（プロジェクト全体で使用されている）
- テストヘルパーにはRailsとの対応を明記

## インポート規約
- パスエイリアス `@/*` を使用
- 相対パスではなく絶対パスを優先

## ESLint設定
- Next.js標準設定を使用
  - `next/core-web-vitals`
  - `next/typescript`

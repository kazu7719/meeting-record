# Meeting Record

会議記録アプリケーション

## 技術スタック

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **テスト**: Jest + React Testing Library

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

アプリケーションは [http://localhost:3000](http://localhost:3000) で起動します。

## テスト

### テストツール

- **Jest** - RSpecに相当するテストフレームワーク
- **React Testing Library** - コンポーネントテスト
- **Test Helpers** - FactoryBotに相当するテストデータ生成ヘルパー

### テストコマンド

```bash
# テストを実行
npm test

# ウォッチモードでテストを実行
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage
```

### テストファイルの配置

- `__tests__/` - テストファイル（RSpecの `spec/` に相当）
- `lib/test/helpers.ts` - テストヘルパー関数（FactoryBotに相当）

### テストの書き方

```typescript
// __tests__/Example.test.tsx
import { render, screen } from '@testing-library/react'
import { buildMeeting } from '@/lib/test/helpers'

describe('Example Component', () => {
  it('renders correctly', () => {
    const meeting = buildMeeting({ title: 'Test Meeting' })

    render(<Component meeting={meeting} />)

    expect(screen.getByText('Test Meeting')).toBeInTheDocument()
  })
})
```

## デプロイ

このプロジェクトはVercelへのデプロイに最適化されています。

```bash
# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start
```

## ディレクトリ構造

```
.
├── app/              # Next.js App Router
├── components/       # Reactコンポーネント
├── lib/              # ユーティリティ関数
│   └── test/        # テストヘルパー
├── __tests__/       # テストファイル
└── public/          # 静的ファイル
```

# 推奨コマンド

## 開発コマンド

### セットアップ
```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集してSupabaseの認証情報を設定
```

### 開発サーバー
```bash
# 開発サーバーの起動 (http://localhost:3000)
npm run dev
```

### ビルド・実行
```bash
# プロダクションビルド
npm run build

# プロダクションサーバーの起動
npm start
```

## テストコマンド

```bash
# テストを実行
npm test

# ウォッチモードでテストを実行
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage
```

## コード品質

```bash
# ESLintでコードをチェック
npm run lint
```

## Gitコマンド
```bash
# ステータス確認
git status

# ブランチ確認
git branch

# コミット
git add .
git commit -m "commit message"

# プッシュ
git push origin <branch-name>
```

## macOS (Darwin) 特有の注意事項
- 標準のUnixコマンドが使用可能
- `ls`, `cd`, `grep`, `find` などは通常通り動作
- パス区切りは `/` を使用

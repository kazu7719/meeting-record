# meeting-record / CLAUDE.md

このファイルは、本リポジトリにおける唯一の開発ルールブックである。
GitHub Issue（1〜11）に完全一致する形で、Claude Code が推測せずに実装できることを目的とする。

---

## Role

あなたは熟練した Next.js エンジニアです。
SOLID 原則、および TDD（テスト駆動開発）に従い、保守性が高く安全なコードを書きます。

---

## Workflow

あなたは、以下のステップを実行します。

### Step 1: タスク受付と準備

1. ユーザーから **GitHub Issue 番号**を受け付けたらフロー開始です。`/create-gh-branch` カスタムコマンドを実行し、Issue の取得とブランチを作成します。
2. **[REQUIREMENTS.md](./REQUIREMENTS.md) を参照し、以下を確認します**：
   - 該当 Issue が実現する機能が、プロジェクトゴール（WHO/WHAT/HOW）のどこに位置するか
   - UI/UX方針・データ設計の基本方針との整合性
   - 成功基準（実務的/技術的）を満たせる実装か
3. Issue の内容を把握し、関連するコードを調査します。調査時には SerenaMCP の解析結果を利用してください。

### Step 2: 実装計画の策定と承認

1. 分析結果に基づき、実装計画を策定します。
2. 計画をユーザーに提示し、承認を得ます。**承認なしに次へ進んではいけません。**

### Step 3: 実装・レビュー・修正サイクル

1. 承認された計画に基づき、実装を行います。
2. 実装完了後、**`nextjs-reviewer` サブエージェントを呼び出し、コードレビューを実行させます。**
3. 実装内容とレビュー結果をユーザーに報告します。
4. **【ユーザー承認】**: 報告書を提示し、承認を求めます。
   - `yes`: コミットして完了。
   - `fix`: 指摘に基づき修正し、再度レビューからやり直す。

---

## Rules

以下のルールは、あなたの行動を規定する最優先事項およびガイドラインです。

### 重要・最優先事項 (CRITICAL)

- **ユーザー承認は絶対**: いかなる作業も、ユーザーの明示的な承認なしに進めてはいけません。
- **品質の担保**: コミット前には必ずテスト（`npm test`）を実行し、全てパスすることを確認してください。
- **効率と透明性**: 作業に行き詰まった場合、同じ方法で3回以上試行することはやめてください。
- **SerenaMCP 必須**: コードベースの調査・分析には必ず SerenaMCP を使用すること。`Read` ツールでソースファイル全体を読み込むことは禁止。

### SerenaMCP 使用ガイド

コード解析は必ず以下のツールを使用してください。

| ツール | 用途 | 使用例 |
|--------|------|--------|
| `find_symbol` | コンポーネント・関数・型の検索、シンボルの定義取得 | 特定関数の実装を確認したいとき |
| `get_symbols_overview` | ファイル内のシンボル一覧を取得 | ファイル構造を把握したいとき |
| `find_referencing_symbols` | シンボルの参照箇所を検索 | 関数がどこから呼ばれているか調べるとき |
| `search_for_pattern` | 正規表現でコード検索 | 特定パターンの使用箇所を探すとき |

#### 禁止事項

- ❌ `Read` ツールでソースファイル（.ts / .tsx）全体を読み込む
- ❌ 目的なくファイル内容を取得する
- ❌ SerenaMCP で取得可能な情報を他の方法で取得する

### 基本理念 (PHILOSOPHY)

- **大きな変更より段階的な進捗**: テストを通過する小さな変更を積み重ねる。
- **シンプルさが意味すること**: コンポーネントや関数は単一責任を持つ（Single Responsibility）。

### 技術・実装ガイドライン

- **実装プロセス (TDD)**: Red → Green → Refactor のサイクルを厳守する。
- **アーキテクチャ**: Server Components を優先し、Client Components は必要最小限に抑える。
- **完了の定義**:
  - [ ] テストが通っている（`npm test`）
  - [ ] ESLint のエラーがない（`npm run lint`）
  - [ ] ビルドが成功する（`npm run build`）
  - [ ] Next.js アプリが正常に動作する（`npm run dev`）

---

## Commands

開発で頻繁に使用するコマンドです。

### Test & Lint

- **Jest (テスト)**: `npm test`
- **Jest (Watch モード)**: `npm run test:watch`
- **ESLint (Lint)**: `npm run lint`
- **TypeScript (型チェック)**: `npx tsc --noEmit`

### Next.js

- **開発サーバー**: `npm run dev`
- **本番ビルド**: `npm run build`
- **本番サーバー**: `npm start`

### Supabase

- **ローカル起動**: `npx supabase start`
- **マイグレーション作成**: `npx supabase migration new <name>`
- **マイグレーション適用**: `npx supabase db push`
- **型生成**: `npx supabase gen types typescript --local > types/supabase.ts`

---

## プロジェクトのゴール

### 体験ゴール

- 企業が URL を開いて、ログインなしで生成 AI（Gemini）を即体験できる
  - 要約（Issue 7）
  - アクション抽出（Issue 8）
  - QA（Issue 9）
- 保存・共有・履歴・検索はログイン後のみ（Issue 1 / 2 / 10）

### データ設計ゴール

- 正データ：minutes.raw_text（AI で改変禁止）
- 派生：summary / action_items / QA 結果（再生成前提）
- 型・制約・用途を明示し、AI の推測余地を排除（Issue 3）

---

## 技術スタック（厳守）

### フロントエンド

- Next.js 15（App Router 前提）
- React 19
- TypeScript（Strict mode）
- Tailwind CSS

### バックエンド

- Next.js Server Actions
- Next.js API Routes（必要に応じて）
- Gemini API（サーバー側呼び出しのみ）

### 認証 / DB / Storage

- Supabase
  - Auth（Email / Password）
  - PostgreSQL
  - Row Level Security（RLS）
  - Storage（音声ファイル）

### AI

- Google Gemini
  - API キーはサーバー側環境変数で管理
  - クライアントにキーを露出させない

### テスト

- Jest 30
- ts-jest（TypeScript 対応）
- React Testing Library（コンポーネントテスト）
- @testing-library/jest-dom（マッチャー）

---

## テスト方針（必須）

### テストの考え方

- 実装より先にテストの責務を決める
- テストは「仕様の担保」であり「実装詳細の確認」はしない
- Issue に書かれている仕様だけをテストする

### テスト対象

- **UI**
  - ボタン表示/非表示（ゲスト vs ログイン）
  - AI 実行ボタンが明示的に存在すること
- **ロジック**
  - ゲスト時に保存処理が走らない
  - ログイン後のみ DB 保存が行われる
- **API**
  - レート制限
  - 入力文字数制限
  - キャッシュが効いていること

---

## 開発ルール

- 1 Issue = 1 ブランチ = 1 コミット
- Issue に書かれていない仕様を勝手に追加しない
- 推測で仕様を補完しない
- Acceptance を満たしたら作業を止める

---

## 非交渉ルール

### 正データ保護

- minutes.raw_text は正データ
- AI による整形・要約・書き換えは禁止

### 創作禁止

- raw_text に存在しない内容を生成しない
- QA で根拠が取れない場合は必ず「記載がありません」と返す

### ゲスト体験と保存制御

- ゲスト：AI 実行 OK / DB 永続保存 NG
- ログイン後：保存・共有・検索・音声アップロード可
- ログイン要求は保存操作時のみ

### コスト・乱用対策（必須）

- guest_id cookie + IP によるレート制限
- 入力文字数制限
- 連打防止
- 同一入力キャッシュ必須

---

## アーキテクチャ（Issue 対応）

### 認証（Issue 1）

- Supabase Auth（Email / Password）
- Confirm Email は必須にしない（デモ用途）
- 未ログインでも AI 実行可能
- profiles テーブルで department_id を管理（1人=1部門）

### RLS（Issue 2）

- 閲覧：同一部門のみ
- 編集・削除：作成者のみ
- 対象：minutes / action_items / audio_files / ai_jobs
- Storage（音声）も部門境界を守る

### データモデル（Issue 3）

- profiles / minutes / action_items / audio_files / ai_jobs
- raw_text NOT NULL
- action_items.evidence NOT NULL
- FK + ON DELETE CASCADE 必須

### 音声アップロード（Issue 4）

- ログイン後のみ
- MIME：audio/mp4（m4a）
- サイズ上限：20MB
- Storage パス：`{department_id}/{minute_id}/{timestamp}_{filename}`

### raw_text 登録（Issue 5）

- ゲスト：入力のみ
- ログイン後：minutes.raw_text として保存
- raw_text は加工しない
- 最大 30,000 文字

### UI（Issue 6）

- 「AI はボタンで実行」を明示
- ゲスト：入力 → AI 体験 → 保存ボタン（ログイン誘導）
- ログイン後：一覧 / 詳細 / 保存 / 検索 / 音声

### 検索（Issue 10）

- ログイン後のみ
- title / meeting_date / raw_text
- RLS 前提

### README（Issue 11）

- ゲスト即体験の意図
- 保存はログイン後のみ
- raw_text 正・派生再生成
- Gemini はサーバー側キー保持
- レート制限・キャッシュ
- デモ手順

---

## AI 共通仕様（Issue 7/8/9）

- Gemini API は必ずサーバー側で実行
- API キーは環境変数
- guest_id cookie を発行し IP と併用して制限
- raw_text 最大 30,000 文字
- question 最大 800 文字
- キャッシュキー
  - 要約/抽出：sha256(raw_text)
  - QA：sha256(raw_text + question)
- TTL：6〜24 時間
- エラー時は内部情報を返さない

---

## AI 機能仕様

### Issue 7：要約

- 入力：raw_text
- 出力：summary（text）
- 創作禁止
- ゲスト：表示のみ
- ログイン後：minutes.summary に保存

### Issue 8：アクション抽出

- 入力：raw_text
- 出力形式（固定）：
  ```json
  [
    {
      "task_content": "タスク内容",
      "assignee_name": null,
      "due_at": null,
      "note": null,
      "evidence": "raw_textからの引用"
    }
  ]
  ```
- evidence 必須
- due_at 推測禁止
- ゲスト：表示のみ
- ログイン後：action_items 保存

### Issue 9：QA

- 入力：question + raw_text
- 出力：answer / evidence
- 根拠なし → 「記載がありません」
- 外部知識禁止
- ゲスト：表示のみ

---

## DB 保存（ログイン後のみ）

- minutes：
  - owner_id = auth.uid()
  - department_id = profiles.department_id
- summary：minutes.summary
- action_items：evidence 必須

---

## 環境変数

- `GEMINI_API_KEY`
- `AI_RATE_LIMIT_PER_DAY`
- `AI_RAW_TEXT_MAX_CHARS`
- `AI_QUESTION_MAX_CHARS`
- `AI_CACHE_TTL_SECONDS`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（サーバー側のみ）

---


## やらないこと

- ページ表示時の自動 AI 実行
- ユーザーに API キー入力させる
- 推測で期限・担当者を埋める
- QA で外部知識を混ぜる
- Server Components で 'use client' を不必要に使用する
- クライアント側で Gemini API を直接呼び出す


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
2. **[REQUIREMENTS.md](./REQUIREMENTS.md) と [docs/design.md](./docs/design.md) を参照し、以下を確認します**：
   - 該当 Issue が実現する機能が、プロジェクトゴール（WHO/WHAT/HOW）のどこに位置するか
   - UI/UX方針・データ設計の基本方針との整合性
   - 成功基準（実務的/技術的）を満たせる実装か
   - **機能仕様（機能ID、仕様詳細、受け入れ条件）との整合性**
   - **テーブル定義・ER図・データ構造との整合性**
   - **AI機能の場合、共通仕様（レート制限、キャッシュ、創作禁止、根拠必須等）の遵守**
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

## 機能一覧

本プロジェクトは以下の10機能で構成されます。

| 機能ID | 機能名 | Issue | ゲスト | ログイン後 |
|--------|--------|-------|--------|-----------|
| F-001 | 認証 | Issue 1 | - | ○ |
| F-002 | 部門共有・RLS | Issue 2 | - | ○ |
| F-003 | raw_text 入力 | Issue 5 | ○ | ○ |
| F-004 | AI要約 | Issue 7 | ○（表示のみ） | ○（保存可） |
| F-005 | AIアクション抽出 | Issue 8 | ○（表示のみ） | ○（保存可） |
| F-006 | AI QA | Issue 9 | ○（表示のみ） | ○ |
| F-007 | 議事録保存 | Issue 5 | - | ○ |
| F-008 | 議事録一覧・詳細 | Issue 6 | - | ○ |
| F-009 | 議事録検索 | Issue 10 | - | ○ |
| F-010 | 音声アップロード | Issue 4 | - | ○ |

各機能の詳細仕様・受け入れ条件は **[docs/design.md](./docs/design.md)** を参照してください。

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
- **profiles 自動作成**:
  - ログイン直後に profiles レコードが存在しなければ作成
  - profiles.id = auth.uid() に一致させる
  - department_id を必ずセット（1人=1部門）

### RLS（Issue 2）

#### 基本方針
- **DBレベルで権限を担保**（フロント制御に依存しない）
- **department_id偽装防止**: profilesから導出、フロント入力を信用しない

#### 権限仕様
**minutes**
- SELECT: 自分のdepartment_idと一致するもののみ
- INSERT: owner_id=auth.uid() かつ department_id=profiles.department_id
- UPDATE/DELETE: owner_id=auth.uid()のみ

**action_items / audio_files / ai_jobs**
- SELECT: 親minutesが自部門のもののみ
- INSERT/UPDATE/DELETE: 親minutesがowner_id=auth.uid()のもののみ

**Storage（音声）**
- パス: `{department_id}/{minute_id}/{timestamp}_{filename}`
- 読み取り: 同部門のみ
- 書き込み: owner_id=auth.uid()のminuteのみ

具体的なRLSポリシー（SQL）は **[docs/design.md](./docs/design.md)** を参照してください。

### データモデル（Issue 3）

#### テーブル一覧
- **profiles**: ユーザー・部門情報（1人=1部門）
- **minutes**: 議事録（raw_textが正データ）
- **action_items**: アクションプラン（evidence必須）
- **audio_files**: 音声ファイルメタデータ
- **ai_jobs**: AI実行履歴

#### 重要な制約（厳守）
- **raw_text NOT NULL**: 正データは必須
- **action_items.evidence NOT NULL**: 根拠引用は必須（創作防止）
- **NULL = 不明・未言及**: 推測で埋めない（assignee_name, due_atなど）
- **FK + ON DELETE CASCADE**: 親削除時に子も自動削除
- **department_id偽装防止**: INSERT時にprofilesから導出（RLSで担保）

詳細なテーブル定義・ER図は **[docs/design.md](./docs/design.md)** を参照してください。

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

#### ゲストトップ画面（最重要）
- **初期状態**: サンプル議事録（開発進捗定例）が入っている
- **サンプル操作**: 「サンプル議事録を挿入」ボタン、「クリア」ボタン
- **AI実行**: 「要約を生成」「アクションを抽出」「質問する（QA）」ボタンを明示
- **誤解防止の文言（必須）**:
  - 「AI機能はボタンを押すと実行されます（自動では実行されません）」
  - 「このアプリは入力テキスト（raw_text）を元にAI処理します」
  - 「保存・共有・検索・音声アップロードはログイン後に利用できます」
  - 「AIは入力テキストにない内容を創作しません」
- **保存ボタン**: 未ログイン時はログイン誘導

#### ログイン後
- 一覧 / 詳細 / 保存 / 検索 / 音声アップロード

詳細な画面仕様は **[docs/design.md](./docs/design.md)** の F-008 を参照してください。

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

### サーバー側実行（厳守）
- Gemini API は**必ずサーバー側で実行**
- APIキーは環境変数で管理
- クライアントにキーを**絶対に**露出させない

### 乱用/コスト対策（必須）

#### レート制限
- guest_id cookie（初回アクセス時に発行） + IP で日次回数制限（環境変数: `AI_RATE_LIMIT_PER_DAY`）

#### 入力文字数制限
- raw_text: 最大 30,000 文字（`AI_RAW_TEXT_MAX_CHARS`）
- question: 最大 800 文字（`AI_QUESTION_MAX_CHARS`）

#### 連打防止
- 短時間（10〜30秒）以内の連続実行を拒否

#### キャッシュ（必須）
- **要約/抽出**: key=`sha256(raw_text)`, TTL=6〜24時間
- **QA**: key=`sha256(raw_text + question)`, TTL=6〜24時間
- 環境変数: `AI_CACHE_TTL_SECONDS`

### エラーハンドリング
- エラー時は**内部情報を返さない**
- ユーザーには汎用メッセージを表示（例: 「エラーが発生しました。しばらく経ってから再度お試しください」）
- **具体的なエラー処理**:
  - **レート制限超過**: 制限超過メッセージを表示
  - **入力文字数超過**: 文字数上限の案内を表示
  - **JSONパースエラー（アクション抽出）**: エラー表示し、再生成を促す（内部情報は見せない）

### 創作禁止・根拠必須（厳守）
- **要約**: raw_textにない内容は出さない
- **アクション抽出**: evidence（根拠引用）必須、不明な担当者・期限はnull
- **QA**: 根拠がない場合は必ず「記載がありません」、外部知識を混ぜない

詳細な仕様は **[docs/design.md](./docs/design.md)** を参照してください。

---

## AI 機能仕様

### Issue 7：要約

- 入力：raw_text
- 出力：summary（text）
- **出力品質要件**:
  - 読みやすさ優先（箇条書き主体）
  - raw_textに存在する範囲で以下を含める:
    - 決定事項（何が決まったか）
    - 主要論点（何が議論されたか）
    - 次アクションの方向性（担当者・期限はIssue 8で確定）
- 創作禁止（raw_textにない内容は出さない）
- ゲスト：表示のみ
- ログイン後：minutes.summary に保存

### Issue 8：アクション抽出

- 入力：raw_text
- 出力形式（固定）：**必ずJSONとしてパース可能であること（必須）**
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
- **JSON要件（厳守）**:
  - JSON配列（必ず配列）
  - 各要素は以下キーを必ず持つ（キー欠落は失敗扱い）
  - パース不能・キー欠落は失敗扱い
- evidence 必須（根拠引用、創作防止）
- due_at 推測禁止（言及がなければ null）
- assignee_name 推測禁止（言及がなければ null）
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

## 用語集

| 用語 | 説明 |
|------|------|
| **raw_text** | 会議の文字起こしテキスト（正データ）。AI で改変禁止。 |
| **正データ** | AI で改変禁止のデータ（raw_text）。 |
| **派生データ** | AI で生成され、再生成可能なデータ（summary、action_items）。 |
| **evidence** | AI が生成したアクション等の根拠引用。創作防止のため必須。 |
| **guest_id** | ゲストユーザーを識別するための cookie（レート制限に使用）。 |
| **department_id** | 部門ID。RLSの境界。1人=1部門。 |
| **RLS** | Row Level Security（行レベルセキュリティ）。DBレベルで権限制御。 |

---

## やらないこと

- ページ表示時の自動 AI 実行
- ユーザーに API キー入力させる
- 推測で期限・担当者を埋める
- QA で外部知識を混ぜる
- Server Components で 'use client' を不必要に使用する
- クライアント側で Gemini API を直接呼び出す

---

## 参照ドキュメント

本プロジェクトの仕様は以下のドキュメントで管理されています。

- **[REQUIREMENTS.md](./REQUIREMENTS.md)**: 要件定義書（プロジェクトゴール、ターゲットユーザー、成功基準）
- **[docs/design.md](./docs/design.md)**: 設計書（機能仕様、テーブル定義、ER図、AI共通仕様、RLS）
- **[GitHub Issues 1-11](https://github.com/kazu7719/meeting-record/issues)**: 詳細な実装仕様と受け入れ条件

実装時は、必ずこれらのドキュメントを確認してください。


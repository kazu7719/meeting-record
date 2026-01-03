<h1>アプリケーション名</h1>
Meeting Record

<h1>アプリケーション概要</h1>
プロジェクト・タスク・習慣を登録し、カレンダー上で管理ができる

<h1>URL</h1>
meeting-record-theta.vercel.app

<h1>テスト用アカウント</h1>
<br>・メールアドレス :test@test.com</br>
<br>・パスワード :test7645</br>

<h1>利用方法</h1>
<h2>議事録作成</h2>
<br>1:トップページ(議事録一覧ページ)上部の「新規議事録作成」を押す</br>
<br>2:新規登録画面でプロジェクトの内容(保存先チーム名・タイトル・会議日・議事録本文)を入力し登録する</br>
<br>※議事録本文にはスマホなどで録音した音声をGeminiなどの文字起こし対応AIサービスで文字起こししたテキストを貼り付ける</br>
<br>3:議事録詳細画面のAI機能「要約」を押すとAIが要約したものが出てきて自動保存される</br>
<br>4:議事録詳細画面のAI機能「アクションを抽出」を押すとAIによる各個人のタスクを抽出したものが出てきて自動保存される</br>
<br>5:議事録一覧の検索機能で、キーワードを引っ掛け確認したい議事録の検索が可能</br>
<h2>チーム管理</h2>
<br>1:トップページ(カレンダー表示ページ)下部の「タスクを登録・確認」を押す</br>
<br>2:タスク一覧ページ上部の「タスク新規登録」を押す</br>
<br>3:新規登録画面でタスクの内容(名称・開始日・終了予定日・終了日・メモ)を入力し登録する</br>
<br>4:完了したタスクは一覧画面でチェックを行う</br>

<h1>アプリケーションを作成した背景</h1>


<h1>実装した機能についての画像やGIFおよびその説明</h1>
<br>①</br>



<br>②</br>



<br>③</br>



<br>④</br>



<br>⑤</br>



<h1>データベース設計</h1>

 erDiagram
      %% ================================================
      %% 認証・ユーザー管理
      %% ================================================

      auth_users ||--|| profiles : "1:1"
      auth_users ||--o{ departments : "所有 (owner_id)"
      auth_users ||--o{ user_departments : "所属"
      auth_users ||--o{ minutes : "作成 (owner_id)"
      auth_users ||--o{ invitations : "作成 (created_by)"
      auth_users ||--o{ invitation_uses : "使用"

      auth_users {
          uuid id PK "認証ユーザーID"
          text email "メールアドレス"
          timestamptz created_at "作成日時"
      }

      profiles {
          uuid id PK "auth.users.id"
          uuid department_id "旧部門ID (非推奨)"
          uuid current_department_id FK "現在のチームID"
          timestamptz created_at "作成日時"
      }

      %% ================================================
      %% チーム管理（マルチチーム対応）
      %% ================================================

      departments ||--o{ user_departments : "所属メンバー"
      departments ||--o{ invitations : "招待リンク"
      departments ||--o| profiles : "現在のチーム (current_department_id)"

      departments {
          uuid id PK "チームID"
          text name "チーム名"
          uuid owner_id FK "オーナーID"
          timestamptz created_at "作成日時"
          timestamptz updated_at "更新日時"
      }

      user_departments {
          uuid id PK
          uuid user_id FK "ユーザーID"
          uuid department_id FK "チームID"
          text role "権限 (owner/admin/member)"
          timestamptz joined_at "参加日時"
      }

      invitations {
          uuid id PK "招待ID"
          uuid department_id FK "チームID"
          text token UK "招待トークン"
          uuid created_by FK "作成者ID"
          timestamptz expires_at "有効期限"
          integer max_uses "最大使用回数"
          integer use_count "使用回数"
          timestamptz created_at "作成日時"
      }

      invitations ||--o{ invitation_uses : "使用履歴"

      invitation_uses {
          uuid id PK
          uuid invitation_id FK "招待ID"
          uuid user_id FK "使用者ID"
          timestamptz used_at "使用日時"
      }

      %% ================================================
      %% 議事録管理
      %% ================================================

      minutes ||--o{ action_items : "アクション"
      minutes ||--o{ ai_jobs : "AI実行履歴"

      minutes {
          uuid id PK "議事録ID"
          text title "会議名"
          uuid department_id "チームID (FK制約なし)"
          uuid owner_id FK "作成者ID"
          text raw_text "議事録本文 (正データ)"
          text summary "要約 (派生データ)"
          date meeting_date "会議日"
          timestamptz created_at "作成日時"
          timestamptz updated_at "更新日時"
      }

      action_items {
          uuid id PK "アクションID"
          uuid minute_id FK "議事録ID"
          text task_content "タスク内容"
          text assignee_name "担当者名"
          timestamptz due_at "期限"
          text note "補足"
          text evidence "根拠引用 (必須)"
          timestamptz created_at "作成日時"
      }

      ai_jobs {
          uuid id PK "ジョブID"
          uuid minute_id FK "議事録ID"
          text job_type "処理種別 (summary/action/qa)"
          text status "状態 (pending/success/failed)"
          text error_message "エラー内容"
          timestamptz created_at "作成日時"
      }


<h1>画面遷移図</h1>




<h1>開発環境</h1>
<h2>言語</h2>
<br>・ruby</br>
<br>・HTML</br>
<br>・CSS</br>
<br>・Javascript</br>
<h2>サービス</h2>
<br>・フロントエンド</br>
<br>・バックエンド</br>
<br>・テスト</br>
<br>・プロジェクト・タスク・習慣チェック機能</br>
<br>・カレンダー機能</br>


<h1>ローカルでの動作方法</h1>
<br>以下のコマンドを順に実行</br>
<br>% git clone https://github.com/kazu7719/jobwin</br>
<br>% cd projects/jobwin</br>
<br>% bundle install</br>
<br>% rails db:create</br>
<br>% rails db:migrate<br>

<h1>工夫したポイント</h1>
<br>・一つのカレンダーに登録したプロジェクト・タスク・習慣が閲覧できるように設計</br>
<br>・カレンダーの日付をクリックすると、下にその日のプロジェクト・タスク・習慣が表示され、1日単位でやることが可視化されるように設計</br>
<br>・プロジェクト登録の際にタスクを複数追加できる設計にし、1つのプロジェクトに対する各作業を分解することが可能</br>
<br>・習慣機能内にカレンダーのチェック表と進捗率を配置し、習慣を継続しやすい仕組みに構築</br>
<br>・学習範囲外の処理（ProjectTaskの複合ロジック、カレンダーUI、各日の内容表示のJavaScript処理など）に AI を活用し、生成コードの役割を理解したうえで統合。</br>
<br>・プロジェクト・タスク・習慣機能に対する結合テストでは、テストケース（Example）の設計は自分で行い、RSpecコード生成はAIを活用。</br>
<br>・設計・判断は自分が主体、実装の一部にAIを活用する明確な分担を行い、現代の開発で求められるAI活用能力を身につけた。</br>

<h1>改善点</h1>
<br>・フロント領域（JavaScript / CSS / カレンダーUI）の理解深化</br>
<br>→AI生成コードを教材に分解し、UIの動的処理への理解を強化する予定。</br>
<br>・RSpec記法の理解を深め、自力で書けるテストの幅を拡大</br>
<br>→テスト仕様設計はできているため、AI生成コードの分析を通して記法理解を強化していく。</br>
<br>・複合モデルの入力に FormObject を応用する余地を探索</br>
<br>→現状は Project と ProjectTask を通常のCRUDで管理しているが、FormObject を導入することで
コントローラの責務分離・保守性・拡張性が向上する可能性があるため、今後の設計改善の候補として検討する。</br>


<h1>制作時間</h1>
約30時間








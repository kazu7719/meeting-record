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
<br>1:チーム管理からチームを作成、または招待リンクからチームに参加</br>
<br>※チーム作成は下記チーム管理の利用方法を参照</br>
<br>2:トップページ(議事録一覧ページ)上部の「新規議事録作成」を押す</br>
<br>3:新規登録画面でプロジェクトの内容(保存先チーム名・タイトル・会議日・議事録本文)を入力し登録する</br>
<br>※議事録本文にはスマホなどで録音した音声をGeminiなどの文字起こし対応AIサービスで文字起こししたテキストを貼り付ける</br>
<br>4:議事録詳細画面のAI機能「要約」を押すとAIが要約したものが出てきて自動保存される</br>
<br>5:議事録詳細画面のAI機能「アクションを抽出」を押すとAIによる各個人のタスクを抽出したものが出てきて自動保存される</br>
<br>6:議事録一覧の検索機能で、キーワードを引っ掛け確認したい議事録の検索が可能</br>
<h2>チーム管理</h2>
<br>1:ヘッダーの「チーム管理」を押す</br>
<br>2:チーム管理ページ内の「+新しいチームを作成」を押し、チーム名を入力し「作成」を押すとチームの作成が可能</br>
<br>3:所属チーム一覧の招待管理を押し、「+新しい招待リンク」を押すと招待リンクが生成され、メンバーに招待リンクを共有することでチームへの参加が可能になる</br>
<br>※招待管理の機能はチームを作成したユーザーが使用可能
<br>4:複数のチームに所属している場合、「切り替え」ボタンを押すことでチームの切り替えが出来、議事録一覧にはその切り替えたチームの議事録が表示される</br>

<h1>アプリケーションを作成した背景</h1>
私がこれまで2社を経験した中で思ったことは、会議での議事録が作成されているが有効活用されない、もしくは議事録が作成されておらず、会議が次の行動に繋がっているという実感が湧かないということであった。これでは会議の価値が下がってしまいただの記録だけで終わってしまうので、AIを使って議事録を要約という形で生成しかつアクションプランも作成してくれる機能を作成した。これにより後から簡単に見返すことができ、次の行動に繋げやすく成果に直結することが可能になり、そのような議事録にしたく今回アプリケーションを実装した。


<h1>実装した機能についての画像やGIFおよびその説明</h1>
<br>①チーム作成を行う動画</br>

[![Image from Gyazo](https://i.gyazo.com/599a78dd4f3cea587fb7ca33976ee66c.gif)](https://gyazo.com/599a78dd4f3cea587fb7ca33976ee66c)

<br>②チーム切り替えを行う動画</br>

[![Image from Gyazo](https://i.gyazo.com/1d347389bbf7ebae716963ce61650f44.gif)](https://gyazo.com/1d347389bbf7ebae716963ce61650f44)

<br>③チーム招待リンクを生成する動画</br>

[![Image from Gyazo](https://i.gyazo.com/8a27e6b759caca31ee18c829eb49e1f9.gif)](https://gyazo.com/8a27e6b759caca31ee18c829eb49e1f9)

<br>④議事録作成を行う動画</br>

[![Image from Gyazo](https://i.gyazo.com/f74b9bcf1c3cc7a27d6c0ea8551072c1.gif)](https://gyazo.com/f74b9bcf1c3cc7a27d6c0ea8551072c1)

<br>⑤議事録詳細画面で要約を生成する動画</br>

[![Image from Gyazo](https://i.gyazo.com/345b2df6d55544102eac35f6bf482754.gif)](https://gyazo.com/345b2df6d55544102eac35f6bf482754)

<br>⑥議事録詳細画面でアクションを抽出する画像</br>

[![Image from Gyazo](https://i.gyazo.com/0641ac2194be53fe0abcb93ddaa95ec5.png)](https://gyazo.com/0641ac2194be53fe0abcb93ddaa95ec5)

<br>⑦議事録検索機能の画像</br>

[![Image from Gyazo](https://i.gyazo.com/750fd6481eac88cd9070e5446f353cf3.png)](https://gyazo.com/750fd6481eac88cd9070e5446f353cf3)

<br>⑧アプリケーション使用方法の画像</br>

[![Image from Gyazo](https://i.gyazo.com/7c7b804eb58ef6509273b0fde4783edb.png)](https://gyazo.com/7c7b804eb58ef6509273b0fde4783edb)

<h1>データベース設計</h1>

[![Image from Gyazo](https://i.gyazo.com/bbdaa331cb25e228c9252f0c90c964a4.png)](https://gyazo.com/bbdaa331cb25e228c9252f0c90c964a4)


<h1>画面遷移図</h1>

[![Image from Gyazo](https://i.gyazo.com/d1c45c4a2b96dbbda61b58deed6424c9.png)](https://gyazo.com/d1c45c4a2b96dbbda61b58deed6424c9)


<h1>開発環境</h1>
<h2>言語</h2>
<br>・TypeScript</br>
<br>・PLpgSQL</br>
<h2>サービス</h2>
<br>・フロントエンド</br>
<br>・バックエンド</br>
<br>・テスト</br>
<br>・データベース(Supabase)</br>
<br>・AI機能(Google Gemini API)</br>


<h1>ローカルでの動作方法</h1>
<br>以下のコマンドを順に実行</br>
<br>% git clone https://github.com/kazu7719/meeting-record</br>
<br>% cd projects/meeting-record</br>
<br>% npm install </br>
<br>% npx supabase start </br>
<br>% npx supabase db reset<br>

<h1>工夫したポイント</h1>
<br>・議事録はチーム単位で管理し、チームに所属していないユーザーは閲覧・作成できないアクセス制御を実装している。</br>
<br>・文字起こしは外部AIサービスを利用する前提のため、チーム所属や操作手順をトップページに明示し、初見ユーザーが迷わないナビゲーションを設けた。</br>
<br>・要約およびアクションプランの生成、編集、削除は議事録の作成者のみが行える権限設計としている。</br>
<br>・MVPとしての価値を明確にするため音声文字起こし機能は実装せず、文字起こし後のテキスト活用にフォーカスした。</br>


<h1>改善点</h1>
<br>・音声文字起こし機能を導入する</br>
<br>→アプリケーション開発の知識が深まったタイミングで実装</br>
<br>・外部ツールと連携させ、議事録を作成した際に自動的に通知が飛ぶようにする</br>
<br>→slackやteamsなどのチャットツールを使用</br>
<br>・ナビゲーションを更に工夫する</br>
<br>→ユーザー状態に応じて次の行動を提示する導線に改善余地があり、チーム未所属時はチーム作成/参加を優先表示し、未入力時は貼り付け手順を提示する。
保存後は詳細画面で要約・アクション生成を強調し、迷いの少ないUIを目指す。</br>


<h1>制作時間</h1>
約20時間








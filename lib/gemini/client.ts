import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gemini API クライアント
 * Issue 7, 8, 9: AI要約・アクション抽出・QA
 *
 * サーバー側でのみ使用（APIキーをクライアントに露出させない）
 */

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient(): GoogleGenerativeAI {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return genAI;
}

/**
 * 要約生成用プロンプト
 */
export function getSummaryPrompt(rawText: string): string {
  return `あなたは会議議事録の要約専門家です。以下の会議議事録を要約してください。

【要約の品質要件】
- 読みやすさ優先（箇条書き主体）
- 以下の要素を含める（存在する範囲で）：
  1. 決定事項（何が決まったか）
  2. 主要論点（何が議論されたか）
  3. 次アクションの方向性（誰が/期限は別途確定するため、ここでは無理に断定しない）
- 議事録にない内容は創作しない

【会議議事録】
${rawText}

【要約】`;
}

/**
 * アクション抽出用プロンプトを生成
 * @param rawText 議事録全文
 * @returns アクション抽出用プロンプト
 */
export function getActionExtractionPrompt(rawText: string): string {
  return `あなたは会議議事録からアクションプランを抽出する専門家です。以下の会議議事録から、次のアクション項目を抽出してください。

【絶対に守るルール】
1. 出力は必ずJSON配列形式で返してください（他の説明文は一切不要）
2. 各アクション項目は以下のキーを必ず持つこと：
   - task_content: タスク内容（文字列、必須）
   - assignee_name: 担当者名（文字列 or null）
   - due_at: 期限（文字列 or null）
   - note: 補足（文字列 or null）
   - evidence: 根拠引用（文字列、必須）
3. evidence は必ず議事録からの直接引用であること（創作禁止）
4. 担当者や期限が議事録に明記されていない場合は null にすること（推測禁止）
5. 議事録にアクション項目が存在しない場合は空配列 [] を返すこと

【出力例】
[
  {
    "task_content": "ログイン機能の実装",
    "assignee_name": "田中",
    "due_at": null,
    "note": "UI/UXレビュー後に着手",
    "evidence": "田中：ログイン機能を今週中に実装します"
  }
]

【会議議事録】
${rawText}

【アクション項目（JSON配列のみ）】`;
}

/**
 * QA用プロンプトを生成
 * Issue 9: 根拠必須、「記載がありません」規定
 * @param rawText 議事録全文
 * @param question ユーザーの質問
 * @returns QA用プロンプト
 */
export function getQAPrompt(rawText: string, question: string): string {
  return `あなたは会議議事録の内容に答える専門家です。以下の会議議事録に基づいて、質問に回答してください。

【絶対に守るルール】
1. 出力は必ずJSON形式で返してください（他の説明文は一切不要）
2. 以下のキーを必ず持つこと：
   - answer: 回答内容（文字列、必須）
   - evidence: 根拠引用（文字列、必須）
3. 議事録に記載がない内容については、answerに「記載がありません」と回答すること
4. evidence は必ず議事録からの直接引用であること（創作禁止）
5. 外部知識や他の議事録の内容を混ぜないこと（この議事録の内容のみに基づいて回答）
6. 記載がない場合、evidenceには「該当する記載が見つかりませんでした」と記載すること

【出力例1：記載がある場合】
{
  "answer": "参加者は田中、佐藤、鈴木の3名です。",
  "evidence": "参加者：田中、佐藤、鈴木"
}

【出力例2：記載がない場合】
{
  "answer": "記載がありません",
  "evidence": "該当する記載が見つかりませんでした"
}

【会議議事録】
${rawText}

【質問】
${question}

【回答（JSON形式のみ）】`;
}

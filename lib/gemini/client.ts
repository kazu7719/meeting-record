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

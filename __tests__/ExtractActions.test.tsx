import '@testing-library/jest-dom';
import { extractActions } from '@/app/actions/extract-actions';

// Mock environment variables
process.env.GEMINI_API_KEY = 'test-api-key';

// Mock Next.js cookies
let mockGuestIdCounter = 0;
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => {
    const guestId = `test-guest-id-${mockGuestIdCounter++}`;
    return {
      get: jest.fn((name: string) => {
        if (name === 'guest_id') {
          return { value: guestId };
        }
        return null;
      }),
      set: jest.fn(),
    };
  }),
}));

// Mock Gemini API
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () =>
            JSON.stringify([
              {
                task_content: 'タスク1',
                assignee_name: '田中',
                due_at: null,
                note: null,
                evidence: 'raw_textからの引用',
              },
            ]),
        },
      }),
    }),
  })),
}));

describe('extractActions (Server Action)', () => {
  test('raw_textが30,000文字を超える場合はエラーになる', async () => {
    const longText = 'a'.repeat(30001);
    const result = await extractActions({ rawText: longText });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/30,000文字以下にしてください/);
  });

  test('raw_textが空の場合はエラーになる', async () => {
    const result = await extractActions({ rawText: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('有効なraw_textでアクションが抽出される', async () => {
    const rawText = 'テスト会議の内容。田中さんがタスク1を担当します。';
    const result = await extractActions({ rawText });

    expect(result.success).toBe(true);
    expect(result.actions).toBeDefined();
    expect(Array.isArray(result.actions)).toBe(true);
  });

  test('返却値がJSONとしてパース可能', async () => {
    const rawText = 'テスト会議の内容。';
    const result = await extractActions({ rawText });

    expect(result.success).toBe(true);
    expect(result.actions).toBeDefined();
    expect(Array.isArray(result.actions)).toBe(true);
  });

  test('必須キーが全て存在する', async () => {
    const rawText = 'テスト会議の内容。';
    const result = await extractActions({ rawText });

    expect(result.success).toBe(true);
    expect(result.actions).toBeDefined();

    if (result.actions && result.actions.length > 0) {
      const action = result.actions[0];
      expect(action).toHaveProperty('task_content');
      expect(action).toHaveProperty('assignee_name');
      expect(action).toHaveProperty('due_at');
      expect(action).toHaveProperty('note');
      expect(action).toHaveProperty('evidence');
    }
  });
});

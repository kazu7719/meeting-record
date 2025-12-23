import '@testing-library/jest-dom';
import { generateSummary } from '@/app/actions/generate-summary';

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
          text: () => 'モックの要約結果',
        },
      }),
    }),
  })),
}));

// Mock environment variables
const originalEnv = process.env;

describe('generateSummary (Server Action)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      GEMINI_API_KEY: 'test-api-key',
      AI_RAW_TEXT_MAX_CHARS: '30000',
      AI_RATE_LIMIT_PER_DAY: '10',
      AI_CACHE_TTL_SECONDS: '86400',
      AI_DEBOUNCE_SECONDS: '30',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('raw_textが30,000文字を超える場合はエラーになる', async () => {
    const longText = 'a'.repeat(30001);
    const result = await generateSummary({ rawText: longText });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/30,000文字以下にしてください/);
  });

  test('raw_textが空の場合はエラーになる', async () => {
    const result = await generateSummary({ rawText: '' });

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  test('有効なraw_textで要約が生成される', async () => {
    const rawText = 'テスト会議の内容';
    const result = await generateSummary({ rawText });

    expect(result.success).toBe(true);
    expect(result.summary).toBe('モックの要約結果');
  });

  // NOTE: 以下のテストは統合テストまたは手動テストで実施
  // - Gemini APIキーが未設定の場合のエラー（キャッシュ機構により単体テストでは困難）
  // - キャッシュが効き、同一入力でGeminiを再呼び出ししない
  // - レート制限（日次上限超過）
  // - デバウンス（短時間での連続実行）
  // 理由: Server Actionのユニットテストでは、これらの副作用を完全にモックするのが複雑
});

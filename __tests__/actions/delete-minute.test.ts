import { deleteMinute } from '@/app/actions/delete-minute';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('deleteMinute Server Action', () => {
  let mockSupabase: {
    auth: { getUser: jest.Mock };
    from: jest.Mock;
    selectChain?: { eq: jest.Mock; single: jest.Mock };
    deleteChain?: { eq: jest.Mock };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // チェーンメソッドを正しくモックするための設定
    const selectChain = {
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    const deleteChain = {
      eq: jest.fn(),
    };

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn((table: string) => {
        if (table === 'minutes') {
          // select呼び出しかdelete呼び出しかを判別するため、
          // selectとdeleteメソッドを持つオブジェクトを返す
          return {
            select: jest.fn(() => selectChain),
            delete: jest.fn(() => deleteChain),
            update: jest.fn(() => mockSupabase),
            eq: jest.fn(() => mockSupabase),
            single: jest.fn(() => mockSupabase),
          };
        }
        return mockSupabase;
      }),
    };

    // モックを外部から参照できるようにプロパティとして保持
    mockSupabase.selectChain = selectChain;
    mockSupabase.deleteChain = deleteChain;

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  test('認証済みユーザーが自分のminuteを削除できる', async () => {
    const userId = 'user-123';
    const minuteId = 'minute-456';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // owner_id チェック用の select が成功
    mockSupabase.selectChain.single.mockResolvedValueOnce({
      data: { owner_id: userId },
      error: null,
    });

    // 削除が成功
    mockSupabase.deleteChain.eq.mockResolvedValueOnce({
      error: null,
    });

    const result = await deleteMinute(minuteId);

    expect(result.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('minutes');
  });

  test('未認証ユーザーは削除できない', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await deleteMinute('minute-456');

    expect(result.success).toBe(false);
    expect(result.error).toBe('ログインが必要です');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test('データベースエラー時に適切なエラーメッセージを返す', async () => {
    const userId = 'user-123';
    const minuteId = 'minute-456';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // owner_id チェックが成功
    mockSupabase.selectChain.single.mockResolvedValueOnce({
      data: { owner_id: userId },
      error: null,
    });

    // 削除がデータベースエラーで失敗
    mockSupabase.deleteChain.eq.mockResolvedValueOnce({
      error: { message: 'Database error' },
    });

    const result = await deleteMinute(minuteId);

    expect(result.success).toBe(false);
    expect(result.error).toBe('議事録の削除に失敗しました');
  });

  test('他人のminuteは削除できない（owner_idチェックで弾かれる）', async () => {
    const userId = 'user-123';
    const minuteId = 'minute-456';
    const otherUserId = 'user-789';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // owner_id チェックで他人の議事録であることが判明
    mockSupabase.selectChain.single.mockResolvedValueOnce({
      data: { owner_id: otherUserId },
      error: null,
    });

    const result = await deleteMinute(minuteId);

    expect(result.success).toBe(false);
    expect(result.error).toBe('削除権限がありません');
  });
});

import { updateMinute } from '@/app/actions/update-minute';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('updateMinute Server Action', () => {
  let mockSupabase: {
    auth: { getUser: jest.Mock };
    from: jest.Mock;
    update: jest.Mock;
    eq: jest.Mock;
    select: jest.Mock;
    single: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(() => mockSupabase),
      update: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      single: jest.fn(() => mockSupabase),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  test('認証済みユーザーが自分のminuteを更新できる', async () => {
    const userId = 'user-123';
    const minuteId = 'minute-456';
    const updateData = {
      title: '更新されたタイトル',
      meetingDate: '2025-12-30',
      rawText: '更新された議事録本文',
    };

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // owner_id チェック用の select が成功
    mockSupabase.single.mockResolvedValueOnce({
      data: { owner_id: userId },
      error: null,
    });

    // 更新が成功
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: minuteId },
      error: null,
    });

    const result = await updateMinute({
      minuteId,
      title: updateData.title,
      meetingDate: updateData.meetingDate,
      rawText: updateData.rawText,
    });

    expect(result.success).toBe(true);
    expect(mockSupabase.from).toHaveBeenCalledWith('minutes');
    expect(mockSupabase.select).toHaveBeenCalledWith('owner_id');
    expect(mockSupabase.update).toHaveBeenCalledWith({
      title: updateData.title,
      meeting_date: updateData.meetingDate,
      raw_text: updateData.rawText,
      updated_at: expect.any(String),
    });
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', minuteId);
  });

  test('未認証ユーザーは更新できない', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await updateMinute({
      minuteId: 'minute-456',
      title: 'タイトル',
      meetingDate: null,
      rawText: '本文',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('ログインが必要です');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test('タイトルが空の場合はエラーになる', async () => {
    const userId = 'user-123';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    const result = await updateMinute({
      minuteId: 'minute-456',
      title: '',
      meetingDate: null,
      rawText: '本文',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('タイトルは必須です');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test('raw_textが空の場合はエラーになる', async () => {
    const userId = 'user-123';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    const result = await updateMinute({
      minuteId: 'minute-456',
      title: 'タイトル',
      meetingDate: null,
      rawText: '',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('議事録本文は必須です');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test('raw_textが30,000文字を超える場合はエラーになる', async () => {
    const userId = 'user-123';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    const longText = 'a'.repeat(30001);

    const result = await updateMinute({
      minuteId: 'minute-456',
      title: 'タイトル',
      meetingDate: null,
      rawText: longText,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('議事録本文は30,000文字以下にしてください');
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  test('データベースエラー時に適切なエラーメッセージを返す', async () => {
    const userId = 'user-123';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // owner_id チェックが成功
    mockSupabase.single.mockResolvedValueOnce({
      data: { owner_id: userId },
      error: null,
    });

    // 更新がデータベースエラーで失敗
    mockSupabase.single.mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' },
    });

    const result = await updateMinute({
      minuteId: 'minute-456',
      title: 'タイトル',
      meetingDate: null,
      rawText: '本文',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('議事録の更新に失敗しました');
  });

  test('他人のminuteは更新できない（owner_idチェックで弾かれる）', async () => {
    const userId = 'user-123';
    const minuteId = 'minute-456';
    const otherUserId = 'user-789';

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });

    // owner_id チェックで他人の議事録であることが判明
    mockSupabase.single.mockResolvedValueOnce({
      data: { owner_id: otherUserId },
      error: null,
    });

    const result = await updateMinute({
      minuteId,
      title: 'タイトル',
      meetingDate: null,
      rawText: '本文',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('編集権限がありません');
  });
});

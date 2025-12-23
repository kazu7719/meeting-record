import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SaveDialog } from '@/components/save-dialog';

// Mock next/navigation
const mockPush = jest.fn();
const mockRefresh = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
  })),
}));

// Mock saveMinute action
const mockSaveMinute = jest.fn();
jest.mock('@/app/actions/save-minute', () => ({
  saveMinute: (...args: unknown[]) => mockSaveMinute(...args),
}));

describe('SaveDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ダイアログが開閉できる', () => {
    render(<SaveDialog open={true} onOpenChange={jest.fn()} rawText="テスト" />);

    // ダイアログが表示されていることを確認
    expect(screen.getByText('議事録を保存')).toBeInTheDocument();
  });

  test('titleが空の場合、クライアント側でエラーが表示される（重複削除）', async () => {
    // このテストは後で追加した同名のテストと重複しているため削除
    // 新しいテストは140行目以降にあります
  });

  test('raw_textが30,000文字を超える場合はエラーになる', async () => {
    const longText = 'a'.repeat(30001);
    mockSaveMinute.mockResolvedValue({
      success: false,
      error: 'raw_textは30,000文字以下にしてください',
    });

    render(<SaveDialog open={true} onOpenChange={jest.fn()} rawText={longText} />);

    const titleInput = screen.getByLabelText(/会議名/);
    fireEvent.change(titleInput, { target: { value: 'テスト会議' } });

    const saveButton = screen.getByRole('button', { name: /保存/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/30,000文字以下にしてください/)).toBeInTheDocument();
    });
  });

  test('保存成功後、議事録詳細ページにリダイレクトされる', async () => {
    const mockMinuteId = '123e4567-e89b-12d3-a456-426614174000';
    mockSaveMinute.mockResolvedValue({
      success: true,
      minuteId: mockMinuteId,
    });

    render(<SaveDialog open={true} onOpenChange={jest.fn()} rawText="テスト" />);

    const titleInput = screen.getByLabelText(/会議名/);
    fireEvent.change(titleInput, { target: { value: 'テスト会議' } });

    const saveButton = screen.getByRole('button', { name: /保存/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(`/protected/minutes/${mockMinuteId}`);
    });
  });

  test('meeting_dateは任意フィールドである', async () => {
    const mockMinuteId = '123e4567-e89b-12d3-a456-426614174000';
    mockSaveMinute.mockResolvedValue({
      success: true,
      minuteId: mockMinuteId,
    });

    render(<SaveDialog open={true} onOpenChange={jest.fn()} rawText="テスト" />);

    const titleInput = screen.getByLabelText(/会議名/);
    fireEvent.change(titleInput, { target: { value: 'テスト会議' } });

    // meeting_dateを空のまま保存
    const saveButton = screen.getByRole('button', { name: /保存/ });
    fireEvent.click(saveButton);

    // 保存が成功することを確認
    await waitFor(() => {
      expect(mockSaveMinute).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalled();
    });
  });

  test('保存成功時、正しいパラメータでServer Actionが呼ばれる', async () => {
    const mockMinuteId = '123e4567-e89b-12d3-a456-426614174000';
    mockSaveMinute.mockResolvedValue({
      success: true,
      minuteId: mockMinuteId,
    });

    const rawText = 'テスト議事録';
    render(<SaveDialog open={true} onOpenChange={jest.fn()} rawText={rawText} />);

    const titleInput = screen.getByLabelText(/会議名/);
    const dateInput = screen.getByLabelText(/会議日/);

    fireEvent.change(titleInput, { target: { value: 'テスト会議' } });
    fireEvent.change(dateInput, { target: { value: '2025-01-15' } });

    const saveButton = screen.getByRole('button', { name: /保存/ });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveMinute).toHaveBeenCalledWith({
        title: 'テスト会議',
        meetingDate: '2025-01-15',
        rawText: rawText,
      });
    });
  });

  test('titleが空の場合、クライアント側でエラーが表示される', async () => {
    render(<SaveDialog open={true} onOpenChange={jest.fn()} rawText="テスト" />);

    // フォーム要素を取得
    const form = screen.getByRole('button', { name: /保存/ }).closest('form');

    // フォームをsubmit
    if (form) {
      fireEvent.submit(form);
    }

    // クライアント側バリデーションでエラーが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText(/タイトルは必須です/)).toBeInTheDocument();
    });

    // Server Actionが呼ばれないことを確認
    expect(mockSaveMinute).not.toHaveBeenCalled();
  });
});

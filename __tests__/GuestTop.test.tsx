import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuestTop } from '@/components/guest-top';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
  })),
}));

describe('GuestTop', () => {
  test('文字数カウンタが表示される', () => {
    render(<GuestTop />);

    // 文字数カウンタが存在することを確認
    expect(screen.getByText(/文字数:/)).toBeInTheDocument();
  });

  test('初期状態でサンプルテキストの文字数が表示される', () => {
    render(<GuestTop />);

    // サンプルテキストの文字数が表示されていることを確認（大体の範囲で）
    const counter = screen.getByText(/文字数:/);
    expect(counter).toBeInTheDocument();
  });

  test('テキスト入力時に文字数が更新される', () => {
    render(<GuestTop />);

    const textarea = screen.getByLabelText('議事録テキスト入力欄');

    // テキストを変更
    fireEvent.change(textarea, { target: { value: 'テスト' } });

    // 文字数が更新されることを確認（"テスト"は3文字）
    expect(screen.getByText(/文字数: 3/)).toBeInTheDocument();
  });

  test('30,000文字以内では警告が表示されない', () => {
    render(<GuestTop />);

    const textarea = screen.getByLabelText('議事録テキスト入力欄');
    const shortText = 'a'.repeat(1000); // 1,000文字

    fireEvent.change(textarea, { target: { value: shortText } });

    // 警告メッセージが表示されないことを確認
    expect(screen.queryByText(/30,000文字を超えています/)).not.toBeInTheDocument();
  });

  test('30,000文字を超えると警告が表示される', () => {
    render(<GuestTop />);

    const textarea = screen.getByLabelText('議事録テキスト入力欄');
    const longText = 'a'.repeat(30001); // 30,001文字

    fireEvent.change(textarea, { target: { value: longText } });

    // 警告メッセージが表示されることを確認
    expect(screen.getByText(/30,000文字を超えています/)).toBeInTheDocument();
  });

  test('サンプル議事録を挿入ボタンが表示される', () => {
    render(<GuestTop />);

    expect(screen.getByRole('button', { name: /サンプル議事録を挿入/ })).toBeInTheDocument();
  });

  test('クリアボタンが表示される', () => {
    render(<GuestTop />);

    expect(screen.getByRole('button', { name: /クリア/ })).toBeInTheDocument();
  });

  test('クリアボタンを押すとテキストエリアが空になる', () => {
    render(<GuestTop />);

    const textarea = screen.getByLabelText('議事録テキスト入力欄') as HTMLTextAreaElement;
    const clearButton = screen.getByRole('button', { name: /クリア/ });

    // テキストが入っていることを確認
    expect(textarea.value).not.toBe('');

    // クリアボタンをクリック
    fireEvent.click(clearButton);

    // テキストエリアが空になることを確認
    expect(textarea.value).toBe('');
  });

  test('サンプル議事録を挿入ボタンを押すとサンプルテキストが挿入される', () => {
    render(<GuestTop />);

    const textarea = screen.getByLabelText('議事録テキスト入力欄') as HTMLTextAreaElement;
    const sampleButton = screen.getByRole('button', { name: /サンプル議事録を挿入/ });

    // まずクリアしてから
    const clearButton = screen.getByRole('button', { name: /クリア/ });
    fireEvent.click(clearButton);

    expect(textarea.value).toBe('');

    // サンプル挿入ボタンをクリック
    fireEvent.click(sampleButton);

    // サンプルテキストが入ることを確認
    expect(textarea.value).toContain('開発進捗定例');
  });

  test('AI実行ボタンが表示される', () => {
    render(<GuestTop />);

    expect(screen.getByRole('button', { name: /要約を生成/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /アクションを抽出/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /質問する（QA）/ })).toBeInTheDocument();
  });

  test('テキストが空の場合、AI実行ボタンが無効化される', () => {
    render(<GuestTop />);

    const clearButton = screen.getByRole('button', { name: /クリア/ });
    fireEvent.click(clearButton);

    const summaryButton = screen.getByRole('button', { name: /要約を生成/ });
    const actionButton = screen.getByRole('button', { name: /アクションを抽出/ });
    const qaButton = screen.getByRole('button', { name: /質問する（QA）/ });

    expect(summaryButton).toBeDisabled();
    expect(actionButton).toBeDisabled();
    expect(qaButton).toBeDisabled();
  });

  test('30,000文字を超えると、AI実行ボタンが無効化される', () => {
    render(<GuestTop />);

    const textarea = screen.getByLabelText('議事録テキスト入力欄');
    const longText = 'a'.repeat(30001);

    fireEvent.change(textarea, { target: { value: longText } });

    const summaryButton = screen.getByRole('button', { name: /要約を生成/ });
    const actionButton = screen.getByRole('button', { name: /アクションを抽出/ });
    const qaButton = screen.getByRole('button', { name: /質問する（QA）/ });

    expect(summaryButton).toBeDisabled();
    expect(actionButton).toBeDisabled();
    expect(qaButton).toBeDisabled();
  });
});

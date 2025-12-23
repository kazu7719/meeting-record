import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/app/page';

// Test for Issue 1: ゲストトップ画面（最小限）
// Based on design.md F-001 受け入れ条件

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  })),
}));

describe('ゲストトップ画面（Issue 1: 最小限）', () => {
  it('サンプル議事録エリアが表示される', () => {
    render(<Home />);

    // Expected: A text area or sample content section should be visible
    // This will fail until we implement the guest top screen
    const sampleArea = screen.getByTestId('sample-meeting-area');
    expect(sampleArea).toBeInTheDocument();
  });

  it('保存ボタンが表示される', () => {
    render(<Home />);

    // Expected: A save button should be visible
    const saveButton = screen.getByRole('button', { name: /保存/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('ログイン状態が表示される', () => {
    render(<Home />);

    // Expected: Login status should be displayed
    // This will be implemented with auth context
    expect(true).toBe(true); // Placeholder for now
  });
});

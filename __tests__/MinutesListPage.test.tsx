import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import MinutesListPage from '@/app/protected/minutes/page';

// Mock next/navigation
const mockPush = jest.fn();
const mockRedirect = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
  useSearchParams: jest.fn(() => mockSearchParams),
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`REDIRECT: ${url}`);
  },
}));

// Mock Supabase
const mockGetUser = jest.fn();
const mockFrom = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  })),
}));

describe('MinutesListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('未ログイン時はログインページにリダイレクトされる', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Not authenticated'),
    });

    await expect(async () => {
      await MinutesListPage({ searchParams: Promise.resolve({}) });
    }).rejects.toThrow('REDIRECT: /auth/login');

    expect(mockRedirect).toHaveBeenCalledWith('/auth/login');
  });

  test('一覧ページが表示される', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    };
    mockQuery.order.mockResolvedValue({
      data: [],
      error: null,
    });
    mockFrom.mockReturnValue(mockQuery);

    const result = await MinutesListPage({ searchParams: Promise.resolve({}) });
    const { container } = render(result);

    expect(container).toBeInTheDocument();
  });

  test('minutes一覧が表示される', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockMinutes = [
      {
        id: '1',
        title: 'テスト会議1',
        meeting_date: '2025-01-15',
        created_at: '2025-01-15T10:00:00Z',
        raw_text: 'テスト議事録1',
      },
      {
        id: '2',
        title: 'テスト会議2',
        meeting_date: null,
        created_at: '2025-01-14T10:00:00Z',
        raw_text: 'テスト議事録2',
      },
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    };
    mockQuery.order.mockResolvedValue({
      data: mockMinutes,
      error: null,
    });
    mockFrom.mockReturnValue(mockQuery);

    const result = await MinutesListPage({ searchParams: Promise.resolve({}) });
    render(result);

    expect(screen.getByText('テスト会議1')).toBeInTheDocument();
    expect(screen.getByText('テスト会議2')).toBeInTheDocument();
  });

  test('詳細ページへのリンクが表示される', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockMinutes = [
      {
        id: 'minute-123',
        title: 'テスト会議',
        meeting_date: '2025-01-15',
        created_at: '2025-01-15T10:00:00Z',
        raw_text: 'テスト議事録',
      },
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    };
    mockQuery.order.mockResolvedValue({
      data: mockMinutes,
      error: null,
    });
    mockFrom.mockReturnValue(mockQuery);

    const result = await MinutesListPage({ searchParams: Promise.resolve({}) });
    render(result);

    const link = screen.getByRole('link', { name: /テスト会議/ });
    expect(link).toHaveAttribute('href', '/protected/minutes/minute-123');
  });

  test('minutesが0件の場合、適切なメッセージが表示される', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null,
    });

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
    };
    mockQuery.order.mockResolvedValue({
      data: [],
      error: null,
    });
    mockFrom.mockReturnValue(mockQuery);

    const result = await MinutesListPage({ searchParams: Promise.resolve({}) });
    render(result);

    expect(screen.getByText(/議事録がまだありません/)).toBeInTheDocument();
  });
});

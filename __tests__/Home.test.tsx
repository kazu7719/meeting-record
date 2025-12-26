import { ROUTES } from '@/lib/routes';

// Mock next/navigation
const mockRedirect = jest.fn();
jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

describe('Home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to minutes list page', async () => {
    const Home = (await import('@/app/page')).default;

    // Call the function (it will throw because redirect is mocked)
    try {
      Home();
    } catch {
      // redirect throws in Next.js, so we catch it
    }

    expect(mockRedirect).toHaveBeenCalledWith(ROUTES.MINUTES_LIST);
  });
});

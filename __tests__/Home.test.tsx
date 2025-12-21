import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// Mock Next.js navigation for SaveButton component
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock Supabase client for SaveButton component
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    },
  })),
}));

describe('Home', () => {
  it('renders the main heading', () => {
    render(<Home />)

    const heading = screen.getByRole('heading', {
      name: /Meeting Record/i,
    })

    expect(heading).toBeInTheDocument()
  })

  it('displays application description', () => {
    render(<Home />)

    const message = screen.getByText(/会議記録アプリケーション - AI議事録管理/i)

    expect(message).toBeInTheDocument()
  })

  it('displays guest top component', () => {
    render(<Home />)

    const sampleArea = screen.getByTestId('sample-meeting-area')

    expect(sampleArea).toBeInTheDocument()
  })
})

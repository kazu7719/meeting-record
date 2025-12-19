import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home', () => {
  it('renders the main heading', () => {
    render(<Home />)

    const heading = screen.getByRole('heading', {
      name: /Meeting Record/i,
    })

    expect(heading).toBeInTheDocument()
  })

  it('displays welcome message', () => {
    render(<Home />)

    const message = screen.getByText(/会議記録アプリケーションへようこそ/i)

    expect(message).toBeInTheDocument()
  })

  it('displays technology stack information', () => {
    render(<Home />)

    const techInfo = screen.getByText(/Next\.js \+ React で構築されています/i)

    expect(techInfo).toBeInTheDocument()
  })
})

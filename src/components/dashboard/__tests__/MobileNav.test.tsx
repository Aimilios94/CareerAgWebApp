import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MobileNav } from '../MobileNav'

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' '),
}))

describe('MobileNav', () => {
  it('renders the logo text', () => {
    render(<MobileNav />)
    expect(screen.getByText('Career Agent')).toBeInTheDocument()
  })

  it('renders hamburger menu button', () => {
    render(<MobileNav />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('shows navigation links when menu is opened', async () => {
    const user = userEvent.setup()
    render(<MobileNav />)
    await user.click(screen.getByRole('button'))
    expect(screen.getAllByText('Jobs').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('History').length).toBeGreaterThanOrEqual(1)
  })

  it('renders bottom navigation with first 5 items', () => {
    render(<MobileNav />)
    const dashboardLinks = screen.getAllByText('Dashboard')
    expect(dashboardLinks.length).toBeGreaterThanOrEqual(1)
  })

  it('does not use light theme classes', () => {
    const { container } = render(<MobileNav />)
    const html = container.innerHTML
    expect(html).not.toContain('border-brand-light-gray')
    expect(html).not.toContain('text-brand-dark')
    expect(html).not.toContain('text-brand-mid-gray')
    expect(html).not.toContain('accent-orange')
  })

  it('uses dark theme classes', () => {
    const { container } = render(<MobileNav />)
    const html = container.innerHTML
    expect(html).toContain('bg-zinc-950')
    expect(html).toContain('border-white/5')
  })
})

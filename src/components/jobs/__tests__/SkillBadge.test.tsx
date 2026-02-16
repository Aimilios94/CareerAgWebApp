import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SkillBadge } from '../SkillBadge'

describe('SkillBadge', () => {
  // --- Renders skill name for each status ---
  it('renders skill name for matched status', () => {
    render(<SkillBadge skill="React" status="matched" />)
    expect(screen.getByText('React')).toBeInTheDocument()
  })

  it('renders skill name for partial status', () => {
    render(<SkillBadge skill="TypeScript" status="partial" />)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('renders skill name for missing status', () => {
    render(<SkillBadge skill="Docker" status="missing" />)
    expect(screen.getByText('Docker')).toBeInTheDocument()
  })

  // --- Dark theme: matched badge uses emerald colors ---
  it('matched badge has dark emerald background', () => {
    render(<SkillBadge skill="React" status="matched" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-emerald-500/15')
  })

  it('matched badge has dark emerald text color', () => {
    render(<SkillBadge skill="React" status="matched" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-emerald-300')
  })

  it('matched badge has dark emerald border', () => {
    render(<SkillBadge skill="React" status="matched" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border-emerald-500/30')
  })

  // --- Dark theme: matched badge shows checkmark icon ---
  it('matched badge shows checkmark icon', () => {
    render(<SkillBadge skill="React" status="matched" />)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  // --- Dark theme: partial badge uses amber colors ---
  it('partial badge has dark amber background', () => {
    render(<SkillBadge skill="TypeScript" status="partial" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-amber-500/15')
  })

  it('partial badge has dark amber text color', () => {
    render(<SkillBadge skill="TypeScript" status="partial" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-amber-300')
  })

  it('partial badge has dark amber border', () => {
    render(<SkillBadge skill="TypeScript" status="partial" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border-amber-500/30')
  })

  it('partial badge shows yellow circle icon', () => {
    render(<SkillBadge skill="TypeScript" status="partial" />)
    expect(screen.getByText('🟡')).toBeInTheDocument()
  })

  // --- Dark theme: missing badge uses red colors ---
  it('missing badge has dark red background', () => {
    render(<SkillBadge skill="Docker" status="missing" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-red-500/15')
  })

  it('missing badge has dark red text color', () => {
    render(<SkillBadge skill="Docker" status="missing" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('text-red-300')
  })

  it('missing badge has dark red border', () => {
    render(<SkillBadge skill="Docker" status="missing" />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('border-red-500/30')
  })

  it('missing badge shows red circle icon', () => {
    render(<SkillBadge skill="Docker" status="missing" />)
    expect(screen.getByText('🔴')).toBeInTheDocument()
  })

  // --- Click handler behavior ---
  it('calls onClick when partial badge is clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<SkillBadge skill="TypeScript" status="partial" onClick={handleClick} />)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('calls onClick when missing badge is clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<SkillBadge skill="Docker" status="missing" onClick={handleClick} />)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when matched badge is clicked', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<SkillBadge skill="React" status="matched" onClick={handleClick} />)

    await user.click(screen.getByRole('button'))
    expect(handleClick).not.toHaveBeenCalled()
  })

  // --- Info icon visibility ---
  it('shows info icon for partial badges', () => {
    const { container } = render(<SkillBadge skill="TypeScript" status="partial" />)
    const svgIcon = container.querySelector('svg')
    expect(svgIcon).toBeInTheDocument()
  })

  it('shows info icon for missing badges', () => {
    const { container } = render(<SkillBadge skill="Docker" status="missing" />)
    const svgIcon = container.querySelector('svg')
    expect(svgIcon).toBeInTheDocument()
  })

  it('does not show info icon for matched badges', () => {
    const { container } = render(<SkillBadge skill="React" status="matched" />)
    const svgIcon = container.querySelector('svg')
    expect(svgIcon).not.toBeInTheDocument()
  })
})

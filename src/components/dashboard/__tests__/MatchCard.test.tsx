import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchCard } from '../MatchCard'

describe('MatchCard', () => {
  const defaultProps = {
    id: 'test-job-1',
    title: 'Senior Developer',
    company: 'Tech Corp',
    location: 'Remote',
    matchScore: 85,
    postedDate: '2 days ago',
  }

  it('renders job title and company', () => {
    render(<MatchCard {...defaultProps} />)

    expect(screen.getByText('Senior Developer')).toBeInTheDocument()
    expect(screen.getByText('Tech Corp')).toBeInTheDocument()
  })

  it('renders location', () => {
    render(<MatchCard {...defaultProps} />)

    expect(screen.getByText('Remote')).toBeInTheDocument()
  })

  it('renders match score', () => {
    render(<MatchCard {...defaultProps} />)

    expect(screen.getByText('85%')).toBeInTheDocument()
  })

  it('renders posted date', () => {
    render(<MatchCard {...defaultProps} />)

    expect(screen.getByText('Posted 2 days ago')).toBeInTheDocument()
  })

  it('renders salary when provided', () => {
    render(<MatchCard {...defaultProps} salary="$100k - $150k" />)

    expect(screen.getByText('$100k - $150k')).toBeInTheDocument()
  })

  it('does not render salary when not provided', () => {
    render(<MatchCard {...defaultProps} />)

    expect(screen.queryByText('$')).not.toBeInTheDocument()
  })

  it('hides "Not listed" salary', () => {
    render(<MatchCard {...defaultProps} salary="Not listed" />)

    expect(screen.queryByText('Not listed')).not.toBeInTheDocument()
  })

  it('links to job detail page', () => {
    render(<MatchCard {...defaultProps} />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/dashboard/jobs/test-job-1')
  })

  // Score color thresholds: 80+ emerald, 60+ accent, 40+ amber, <40 zinc
  it('applies emerald color for 80%+ matches', () => {
    render(<MatchCard {...defaultProps} matchScore={85} />)

    const scoreElement = screen.getByText('85%')
    expect(scoreElement).toHaveClass('text-emerald-400')
  })

  it('applies accent color for 60-79% matches', () => {
    render(<MatchCard {...defaultProps} matchScore={70} />)

    const scoreElement = screen.getByText('70%')
    expect(scoreElement).toHaveClass('text-accent')
  })

  it('applies amber color for 40-59% matches', () => {
    render(<MatchCard {...defaultProps} matchScore={50} />)

    const scoreElement = screen.getByText('50%')
    expect(scoreElement).toHaveClass('text-amber-400')
  })

  it('applies zinc color for below 40% matches', () => {
    render(<MatchCard {...defaultProps} matchScore={30} />)

    const scoreElement = screen.getByText('30%')
    expect(scoreElement).toHaveClass('text-zinc-400')
  })
})

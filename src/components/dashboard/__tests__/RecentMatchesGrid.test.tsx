import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RecentMatchesGrid } from '../RecentMatchesGrid'

describe('RecentMatchesGrid', () => {
  const mockMatches = [
    {
      id: 'job-1',
      title: 'Frontend Developer',
      company: 'Startup Inc',
      location: 'New York, NY',
      salary: '$120k - $150k',
      matchScore: 92,
      postedDate: 'Just now',
    },
    {
      id: 'job-2',
      title: 'Backend Engineer',
      company: 'Big Tech Co',
      location: 'Remote',
      matchScore: 78,
      postedDate: '1 day ago',
    },
  ]

  it('renders empty state when no matches', () => {
    render(<RecentMatchesGrid matches={[]} />)

    expect(screen.getByText('No recent matches yet')).toBeInTheDocument()
    expect(
      screen.getByText(/Start by uploading your CV and searching for jobs/)
    ).toBeInTheDocument()
  })

  it('renders match cards when matches exist', () => {
    render(<RecentMatchesGrid matches={mockMatches} />)

    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument()
  })

  it('renders all provided matches', () => {
    render(<RecentMatchesGrid matches={mockMatches} />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
  })

  it('displays match scores', () => {
    render(<RecentMatchesGrid matches={mockMatches} />)

    expect(screen.getByText('92%')).toBeInTheDocument()
    expect(screen.getByText('78%')).toBeInTheDocument()
  })

  it('displays company names', () => {
    render(<RecentMatchesGrid matches={mockMatches} />)

    expect(screen.getByText('Startup Inc')).toBeInTheDocument()
    expect(screen.getByText('Big Tech Co')).toBeInTheDocument()
  })

  it('displays locations', () => {
    render(<RecentMatchesGrid matches={mockMatches} />)

    expect(screen.getByText('New York, NY')).toBeInTheDocument()
    expect(screen.getByText('Remote')).toBeInTheDocument()
  })

  it('displays salary when provided', () => {
    render(<RecentMatchesGrid matches={mockMatches} />)

    expect(screen.getByText('$120k - $150k')).toBeInTheDocument()
  })
})

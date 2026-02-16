import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ParsedCVDisplay } from '../ParsedCVDisplay'

describe('ParsedCVDisplay', () => {
  const mockParsedCV = {
    id: 'cv-123',
    filename: 'resume.pdf',
    parsedData: {
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
      experience: [
        { company: 'Tech Corp', role: 'Senior Developer', dates: '2022-2024' },
        { company: 'Startup Inc', role: 'Developer', dates: '2020-2022' },
      ],
      education: [
        { institution: 'MIT', degree: 'Computer Science', year: '2020' },
      ],
      summary: 'Experienced full-stack developer with expertise in React and Node.js.',
    },
    createdAt: '2024-01-15T00:00:00Z',
  }

  it('renders empty state when parsedCV is null', () => {
    render(<ParsedCVDisplay parsedCV={null} />)

    expect(screen.getByText(/no cv uploaded/i)).toBeInTheDocument()
  })

  it('renders skills as badges', () => {
    render(<ParsedCVDisplay parsedCV={mockParsedCV} />)

    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
  })

  it('renders experience timeline with company, role, dates', () => {
    render(<ParsedCVDisplay parsedCV={mockParsedCV} />)

    // First experience
    expect(screen.getByText('Tech Corp')).toBeInTheDocument()
    expect(screen.getByText('Senior Developer')).toBeInTheDocument()
    expect(screen.getByText('2022-2024')).toBeInTheDocument()

    // Second experience
    expect(screen.getByText('Startup Inc')).toBeInTheDocument()
    expect(screen.getByText('Developer')).toBeInTheDocument()
    expect(screen.getByText('2020-2022')).toBeInTheDocument()
  })

  it('renders education section with institution, degree, year', () => {
    render(<ParsedCVDisplay parsedCV={mockParsedCV} />)

    expect(screen.getByText('MIT')).toBeInTheDocument()
    expect(screen.getByText('Computer Science')).toBeInTheDocument()
    expect(screen.getByText('2020')).toBeInTheDocument()
  })

  it('renders professional summary', () => {
    render(<ParsedCVDisplay parsedCV={mockParsedCV} />)

    expect(
      screen.getByText('Experienced full-stack developer with expertise in React and Node.js.')
    ).toBeInTheDocument()
  })

  it('renders filename', () => {
    render(<ParsedCVDisplay parsedCV={mockParsedCV} />)

    expect(screen.getByText('resume.pdf')).toBeInTheDocument()
  })

  it('handles empty skills array gracefully', () => {
    const cvWithNoSkills = {
      ...mockParsedCV,
      parsedData: {
        ...mockParsedCV.parsedData,
        skills: [],
      },
    }

    render(<ParsedCVDisplay parsedCV={cvWithNoSkills} />)

    // Should render without crashing and show skills section heading
    expect(screen.getByText(/skills/i)).toBeInTheDocument()
    // But no skill badges should be present
    expect(screen.queryByText('React')).not.toBeInTheDocument()
  })

  it('handles experience with duration field instead of dates (n8n format)', () => {
    const cvWithDuration = {
      ...mockParsedCV,
      parsedData: {
        ...mockParsedCV.parsedData,
        experience: [
          { company: 'n8n Company', role: 'Automation Engineer', duration: '3 years' },
          { company: 'Workflow Inc', role: 'Developer', duration: '2 years 6 months' },
        ],
      },
    }

    render(<ParsedCVDisplay parsedCV={cvWithDuration} />)

    // Should display company and role
    expect(screen.getByText('n8n Company')).toBeInTheDocument()
    expect(screen.getByText('Automation Engineer')).toBeInTheDocument()
    // Should display duration field value
    expect(screen.getByText('3 years')).toBeInTheDocument()

    // Second experience
    expect(screen.getByText('Workflow Inc')).toBeInTheDocument()
    expect(screen.getByText('Developer')).toBeInTheDocument()
    expect(screen.getByText('2 years 6 months')).toBeInTheDocument()
  })

  it('handles experience with mixed dates and duration fields', () => {
    const cvWithMixedFormats = {
      ...mockParsedCV,
      parsedData: {
        ...mockParsedCV.parsedData,
        experience: [
          { company: 'Modern Corp', role: 'Lead Developer', dates: '2023-Present' },
          { company: 'Legacy Inc', role: 'Junior Developer', duration: '1 year 3 months' },
          { company: 'Both Fields Ltd', role: 'Consultant', dates: '2019-2020', duration: '1 year' },
        ],
      },
    }

    render(<ParsedCVDisplay parsedCV={cvWithMixedFormats} />)

    // Experience with dates field
    expect(screen.getByText('Modern Corp')).toBeInTheDocument()
    expect(screen.getByText('Lead Developer')).toBeInTheDocument()
    expect(screen.getByText('2023-Present')).toBeInTheDocument()

    // Experience with duration field
    expect(screen.getByText('Legacy Inc')).toBeInTheDocument()
    expect(screen.getByText('Junior Developer')).toBeInTheDocument()
    expect(screen.getByText('1 year 3 months')).toBeInTheDocument()

    // Experience with both fields - should prefer dates for display
    expect(screen.getByText('Both Fields Ltd')).toBeInTheDocument()
    expect(screen.getByText('Consultant')).toBeInTheDocument()
    expect(screen.getByText('2019-2020')).toBeInTheDocument()
  })
})

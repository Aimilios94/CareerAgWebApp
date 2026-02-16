import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CVStatsPanel } from '../CVStatsPanel'

describe('CVStatsPanel', () => {
  const mockParsedData = {
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker'],
    experience: [
      { company: 'Tech Corp', role: 'Senior Developer', dates: '2022-2024' },
      { company: 'Startup Inc', role: 'Developer', dates: '2020-2022' },
    ],
    education: [
      { institution: 'MIT', degree: 'Computer Science', year: '2020' },
    ],
    summary: 'Experienced full-stack developer.',
  }

  describe('Empty State', () => {
    it('renders empty state when parsedData is null', () => {
      render(<CVStatsPanel parsedData={null} />)

      expect(screen.getByText(/upload your cv/i)).toBeInTheDocument()
    })

    it('renders empty state when parsedData is undefined', () => {
      render(<CVStatsPanel parsedData={undefined} />)

      expect(screen.getByText(/upload your cv/i)).toBeInTheDocument()
    })
  })

  describe('Skills Section', () => {
    it('renders all skills as badges', () => {
      render(<CVStatsPanel parsedData={mockParsedData} />)

      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('Node.js')).toBeInTheDocument()
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
      expect(screen.getByText('AWS')).toBeInTheDocument()
      expect(screen.getByText('Docker')).toBeInTheDocument()
    })

    it('displays skill count in header', () => {
      render(<CVStatsPanel parsedData={mockParsedData} />)

      expect(screen.getByText(/skills/i)).toBeInTheDocument()
      expect(screen.getByText('6')).toBeInTheDocument()
    })

    it('handles empty skills array', () => {
      const dataWithNoSkills = { ...mockParsedData, skills: [] }
      render(<CVStatsPanel parsedData={dataWithNoSkills} />)

      expect(screen.getByText(/no skills found/i)).toBeInTheDocument()
    })
  })

  describe('Experience Section', () => {
    it('renders experience count', () => {
      render(<CVStatsPanel parsedData={mockParsedData} />)

      // Use getByRole to target the heading specifically
      expect(screen.getByRole('heading', { name: /experience/i })).toBeInTheDocument()
      expect(screen.getByText(/2 positions/i)).toBeInTheDocument()
    })

    it('renders most recent role and company', () => {
      render(<CVStatsPanel parsedData={mockParsedData} />)

      expect(screen.getByText('Tech Corp')).toBeInTheDocument()
      expect(screen.getByText('Senior Developer')).toBeInTheDocument()
    })

    it('handles experience with duration field (n8n format)', () => {
      const dataWithDuration = {
        ...mockParsedData,
        experience: [
          { company: 'Cloud Co', role: 'Lead Dev', duration: '3 years' },
        ],
      }
      render(<CVStatsPanel parsedData={dataWithDuration} />)

      expect(screen.getByText('Cloud Co')).toBeInTheDocument()
      expect(screen.getByText('Lead Dev')).toBeInTheDocument()
    })

    it('handles empty experience array', () => {
      const dataWithNoExp = { ...mockParsedData, experience: [] }
      render(<CVStatsPanel parsedData={dataWithNoExp} />)

      expect(screen.getByText(/no experience listed/i)).toBeInTheDocument()
    })
  })

  describe('Education Section', () => {
    it('renders education information', () => {
      render(<CVStatsPanel parsedData={mockParsedData} />)

      expect(screen.getByText(/education/i)).toBeInTheDocument()
      expect(screen.getByText('MIT')).toBeInTheDocument()
      expect(screen.getByText('Computer Science')).toBeInTheDocument()
    })

    it('handles multiple education entries', () => {
      const dataWithMultiEdu = {
        ...mockParsedData,
        education: [
          { institution: 'MIT', degree: 'PhD CS', year: '2020' },
          { institution: 'Stanford', degree: 'BSc CS', year: '2016' },
        ],
      }
      render(<CVStatsPanel parsedData={dataWithMultiEdu} />)

      expect(screen.getByText('MIT')).toBeInTheDocument()
      expect(screen.getByText('Stanford')).toBeInTheDocument()
    })

    it('handles empty education array', () => {
      const dataWithNoEdu = { ...mockParsedData, education: [] }
      render(<CVStatsPanel parsedData={dataWithNoEdu} />)

      expect(screen.getByText(/no education listed/i)).toBeInTheDocument()
    })
  })

  describe('Summary Section', () => {
    it('renders professional summary', () => {
      render(<CVStatsPanel parsedData={mockParsedData} />)

      expect(screen.getByText('Experienced full-stack developer.')).toBeInTheDocument()
    })

    it('handles empty summary', () => {
      const dataWithNoSummary = { ...mockParsedData, summary: '' }
      render(<CVStatsPanel parsedData={dataWithNoSummary} />)

      // Component should still render without crashing
      expect(screen.getByText('React')).toBeInTheDocument()
    })
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CVQuickView } from '../CVQuickView'

describe('CVQuickView', () => {
  const mockCV = {
    id: 'cv-456',
    filename: 'my-resume.pdf',
    parsed_data: {
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'GraphQL'],
      experience: [
        { company: 'Tech Corp', role: 'Senior Developer', dates: '2022-2024' },
        { company: 'Startup Inc', role: 'Developer', dates: '2020-2022' },
      ],
      education: [
        { institution: 'MIT', degree: 'Computer Science', year: '2020' },
      ],
      summary: 'Experienced full-stack developer with 5+ years of expertise in React, Node.js, and cloud technologies. Passionate about building scalable applications and mentoring junior developers.',
    },
  }

  describe('Empty State', () => {
    it('renders empty state when cv is null', () => {
      render(<CVQuickView cv={null} />)

      expect(screen.getByText(/upload your cv to see ai-powered insights/i)).toBeInTheDocument()
    })
  })

  describe('Analyzing State', () => {
    it('renders analyzing/loading state when cv exists but parsed_data is null', () => {
      const cvWithoutParsedData = {
        id: 'cv-789',
        filename: 'pending-resume.pdf',
        parsed_data: null,
      }

      render(<CVQuickView cv={cvWithoutParsedData} />)

      expect(screen.getByText(/analyzing your cv/i)).toBeInTheDocument()
    })
  })

  describe('Skills Display', () => {
    it('renders first 6 skills as tags', () => {
      render(<CVQuickView cv={mockCV} />)

      // First 6 skills should be visible
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('Node.js')).toBeInTheDocument()
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
      expect(screen.getByText('AWS')).toBeInTheDocument()
      expect(screen.getByText('Docker')).toBeInTheDocument()
    })

    it('shows "+X more" badge when more than 6 skills exist', () => {
      render(<CVQuickView cv={mockCV} />)

      // mockCV has 8 skills, so should show "+2 more"
      expect(screen.getByText('+2 more')).toBeInTheDocument()

      // Skills beyond 6 should NOT be directly visible
      expect(screen.queryByText('Kubernetes')).not.toBeInTheDocument()
      expect(screen.queryByText('GraphQL')).not.toBeInTheDocument()
    })

    it('does not show "+X more" badge when 6 or fewer skills', () => {
      const cvWithFewSkills = {
        ...mockCV,
        parsed_data: {
          ...mockCV.parsed_data,
          skills: ['React', 'TypeScript', 'Node.js'],
        },
      }

      render(<CVQuickView cv={cvWithFewSkills} />)

      expect(screen.queryByText(/\+\d+ more/)).not.toBeInTheDocument()
    })

    it('handles empty skills array gracefully', () => {
      const cvWithNoSkills = {
        ...mockCV,
        parsed_data: {
          ...mockCV.parsed_data,
          skills: [],
        },
      }

      render(<CVQuickView cv={cvWithNoSkills} />)

      // Should render without crashing
      expect(screen.queryByText('React')).not.toBeInTheDocument()
      // Component should still render (check for other content)
      expect(screen.getByText(/senior developer at tech corp/i)).toBeInTheDocument()
    })
  })

  describe('Experience Display', () => {
    it('renders current/most recent experience (first item in array)', () => {
      render(<CVQuickView cv={mockCV} />)

      // Should show "Role at Company" format for most recent experience
      expect(screen.getByText(/senior developer at tech corp/i)).toBeInTheDocument()
    })

    it('handles experience with duration field instead of dates (n8n format)', () => {
      const cvWithDuration = {
        ...mockCV,
        parsed_data: {
          ...mockCV.parsed_data,
          experience: [
            { company: 'Cloud Solutions', role: 'Lead Engineer', duration: '3 years' },
            { company: 'Old Company', role: 'Junior Dev', duration: '1 year' },
          ],
        },
      }

      render(<CVQuickView cv={cvWithDuration} />)

      expect(screen.getByText(/lead engineer at cloud solutions/i)).toBeInTheDocument()
    })

    it('handles empty experience array gracefully', () => {
      const cvWithNoExperience = {
        ...mockCV,
        parsed_data: {
          ...mockCV.parsed_data,
          experience: [],
        },
      }

      render(<CVQuickView cv={cvWithNoExperience} />)

      // Should render without crashing
      // Skills should still be visible
      expect(screen.getByText('React')).toBeInTheDocument()
    })
  })

  describe('Summary Display', () => {
    it('renders professional summary truncated to ~100 chars with ellipsis if longer', () => {
      render(<CVQuickView cv={mockCV} />)

      // The full summary is longer than 100 chars, so it should be truncated
      // Original: "Experienced full-stack developer with 5+ years of expertise in React, Node.js, and cloud technologies. Passionate about building scalable applications and mentoring junior developers."
      // Should be truncated and end with "..."
      const summaryElement = screen.getByText(/experienced full-stack developer/i)
      expect(summaryElement).toBeInTheDocument()
      expect(summaryElement.textContent).toMatch(/\.\.\.$/)
      expect(summaryElement.textContent!.length).toBeLessThanOrEqual(103) // ~100 chars + "..."
    })

    it('does not truncate short summaries', () => {
      const cvWithShortSummary = {
        ...mockCV,
        parsed_data: {
          ...mockCV.parsed_data,
          summary: 'Skilled developer with React expertise.',
        },
      }

      render(<CVQuickView cv={cvWithShortSummary} />)

      const summaryElement = screen.getByText('Skilled developer with React expertise.')
      expect(summaryElement).toBeInTheDocument()
      expect(summaryElement.textContent).not.toMatch(/\.\.\.$/)
    })

    it('handles empty summary gracefully', () => {
      const cvWithNoSummary = {
        ...mockCV,
        parsed_data: {
          ...mockCV.parsed_data,
          summary: '',
        },
      }

      render(<CVQuickView cv={cvWithNoSummary} />)

      // Should render without crashing
      // Skills should still be visible
      expect(screen.getByText('React')).toBeInTheDocument()
    })
  })
})

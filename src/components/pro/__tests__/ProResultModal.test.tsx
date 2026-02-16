import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProResultModal } from '../ProResultModal'

describe('ProResultModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    type: 'cv' as const,
    data: null,
    isLoading: false,
    error: null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<ProResultModal {...defaultProps} isOpen={false} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows loading spinner when isLoading is true', () => {
    render(<ProResultModal {...defaultProps} isLoading={true} />)
    expect(screen.getByText(/generating/i)).toBeTruthy()
  })

  it('shows error message when error is set', () => {
    render(<ProResultModal {...defaultProps} error="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeTruthy()
  })

  it('renders CV data correctly', () => {
    const cvData = {
      summary: 'Experienced developer',
      skills: ['JavaScript', 'React', 'Node.js'],
      experience: [{ role: 'Developer', company: 'Acme', duration: '2 years', highlights: ['Led team'] }],
      atsScore: 87,
    }
    render(<ProResultModal {...defaultProps} type="cv" data={cvData} />)
    expect(screen.getByText('Experienced developer')).toBeTruthy()
    expect(screen.getByText('JavaScript')).toBeTruthy()
    expect(screen.getByText('React')).toBeTruthy()
    expect(screen.getByText(/87/)).toBeTruthy()
  })

  it('renders cover letter data correctly', () => {
    const coverLetterData = {
      subject: 'Application for Engineer',
      body: 'Dear Hiring Manager, I am writing...',
      tone: 'professional',
    }
    render(<ProResultModal {...defaultProps} type="cover-letter" data={coverLetterData} />)
    expect(screen.getByText('Application for Engineer')).toBeTruthy()
    expect(screen.getByText(/Dear Hiring Manager/)).toBeTruthy()
    expect(screen.getByText(/professional/i)).toBeTruthy()
  })

  it('renders interview questions correctly', () => {
    const interviewData = {
      questions: [
        { question: 'Tell me about yourself', type: 'behavioral', guidance: 'Use STAR method', tip: 'Keep it brief' },
        { question: 'Technical skills?', type: 'technical', guidance: 'Be specific', tip: 'Give examples' },
      ],
    }
    render(<ProResultModal {...defaultProps} type="interview" data={interviewData} />)
    expect(screen.getByText('Tell me about yourself')).toBeTruthy()
    expect(screen.getByText('Technical skills?')).toBeTruthy()
    expect(screen.getByText(/behavioral/i)).toBeTruthy()
    expect(screen.getByText('Use STAR method')).toBeTruthy()
  })

  it('calls onClose when close button is clicked', () => {
    render(<ProResultModal {...defaultProps} data={{ summary: 'test' }} />)
    const closeButton = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeButton)
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('has a copy button that copies content to clipboard', async () => {
    const cvData = { summary: 'Experienced developer', skills: ['JavaScript'], atsScore: 87 }
    render(<ProResultModal {...defaultProps} type="cv" data={cvData} />)
    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)
    expect(navigator.clipboard.writeText).toHaveBeenCalled()
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkillComparisonPanel } from '../SkillComparisonPanel'
import type { SkillComparison } from '@/lib/skills'

describe('SkillComparisonPanel', () => {
  const fullComparison: SkillComparison = {
    matched: ['React', 'TypeScript', 'Node.js'],
    partial: ['Python'],
    missing: ['Docker', 'Kubernetes'],
    matchPercentage: 58,
    total: 6,
  }

  const emptyComparison: SkillComparison = {
    matched: [],
    partial: [],
    missing: [],
    matchPercentage: 0,
    total: 0,
  }

  // --- Renders three columns ---
  it('renders matched skills column', () => {
    render(<SkillComparisonPanel comparison={fullComparison} />)
    expect(screen.getByText(/Matched/)).toBeInTheDocument()
  })

  it('renders partial skills column', () => {
    render(<SkillComparisonPanel comparison={fullComparison} />)
    expect(screen.getByText(/Partial/)).toBeInTheDocument()
  })

  it('renders missing skills column', () => {
    render(<SkillComparisonPanel comparison={fullComparison} />)
    expect(screen.getByText(/Missing/)).toBeInTheDocument()
  })

  // --- Shows correct heading text with counts ---
  it('shows matched count in heading', () => {
    render(<SkillComparisonPanel comparison={fullComparison} />)
    expect(screen.getByText('Matched (3)')).toBeInTheDocument()
  })

  it('shows partial count in heading', () => {
    render(<SkillComparisonPanel comparison={fullComparison} />)
    expect(screen.getByText('Partial (1)')).toBeInTheDocument()
  })

  it('shows missing count in heading', () => {
    render(<SkillComparisonPanel comparison={fullComparison} />)
    expect(screen.getByText('Missing (2)')).toBeInTheDocument()
  })

  // --- Shows skill badges within columns ---
  it('renders matched skill badges', () => {
    render(<SkillComparisonPanel comparison={fullComparison} />)
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(screen.getByText('Node.js')).toBeInTheDocument()
  })

  it('renders partial skill badges', () => {
    render(<SkillComparisonPanel comparison={fullComparison} />)
    expect(screen.getByText('Python')).toBeInTheDocument()
  })

  it('renders missing skill badges', () => {
    render(<SkillComparisonPanel comparison={fullComparison} />)
    expect(screen.getByText('Docker')).toBeInTheDocument()
    expect(screen.getByText('Kubernetes')).toBeInTheDocument()
  })

  // --- Shows empty state text per column ---
  it('shows empty state for matched when no matches', () => {
    render(<SkillComparisonPanel comparison={emptyComparison} />)
    expect(screen.getByText('No matched skills')).toBeInTheDocument()
  })

  it('shows empty state for partial when no partial matches', () => {
    render(<SkillComparisonPanel comparison={emptyComparison} />)
    expect(screen.getByText('No partial matches')).toBeInTheDocument()
  })

  it('shows empty state for missing when no missing skills', () => {
    render(<SkillComparisonPanel comparison={emptyComparison} />)
    expect(screen.getByText('No missing skills!')).toBeInTheDocument()
  })

  // --- Improvement tips ---
  it('shows improvement tips when missing skills exist', () => {
    render(<SkillComparisonPanel comparison={fullComparison} />)
    expect(screen.getByText(/Improvement Tips/)).toBeInTheDocument()
  })

  it('includes missing skill names in tips', () => {
    render(<SkillComparisonPanel comparison={fullComparison} />)
    expect(screen.getByText(/Docker and Kubernetes/)).toBeInTheDocument()
  })

  it('shows generic improvement advice', () => {
    render(<SkillComparisonPanel comparison={fullComparison} />)
    expect(screen.getByText(/Highlight transferable skills/)).toBeInTheDocument()
    expect(screen.getByText(/Add relevant projects/)).toBeInTheDocument()
  })

  // --- Tips hidden when showTips=false ---
  it('hides improvement tips when showTips is false', () => {
    render(<SkillComparisonPanel comparison={fullComparison} showTips={false} />)
    expect(screen.queryByText(/Improvement Tips/)).not.toBeInTheDocument()
  })

  // --- Tips hidden when no missing skills ---
  it('hides improvement tips when no missing skills exist', () => {
    const noMissing: SkillComparison = {
      matched: ['React'],
      partial: ['Python'],
      missing: [],
      matchPercentage: 75,
      total: 2,
    }
    render(<SkillComparisonPanel comparison={noMissing} />)
    expect(screen.queryByText(/Improvement Tips/)).not.toBeInTheDocument()
  })
})

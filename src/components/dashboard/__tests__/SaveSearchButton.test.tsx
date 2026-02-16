import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SaveSearchButton } from '../SaveSearchButton'

// Mock the useSavedSearches hook
const mockSaveSearch = vi.fn()
vi.mock('@/hooks/useSavedSearches', () => ({
  useSaveSearch: () => ({
    mutateAsync: mockSaveSearch,
    isPending: false,
  }),
}))

describe('SaveSearchButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSaveSearch.mockResolvedValue({ success: true })
  })

  it('renders bookmark icon button', () => {
    render(<SaveSearchButton searchId="s-1" query="react developer" />)
    const button = screen.getByRole('button', { name: /save search/i })
    expect(button).toBeInTheDocument()
  })

  it('opens dialog on click', async () => {
    const user = userEvent.setup()
    render(<SaveSearchButton searchId="s-1" query="react developer" />)

    await user.click(screen.getByRole('button', { name: /save search/i }))

    expect(screen.getByText('Save Search')).toBeInTheDocument()
    expect(screen.getByDisplayValue('react developer')).toBeInTheDocument()
  })

  it('calls save mutation with searchId and name on submit', async () => {
    const user = userEvent.setup()
    render(<SaveSearchButton searchId="s-1" query="react developer" />)

    await user.click(screen.getByRole('button', { name: /save search/i }))

    const input = screen.getByDisplayValue('react developer')
    await user.clear(input)
    await user.type(input, 'My React Search')

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(mockSaveSearch).toHaveBeenCalledWith({
      searchId: 's-1',
      name: 'My React Search',
    })
  })

  it('uses query as default name if input not changed', async () => {
    const user = userEvent.setup()
    render(<SaveSearchButton searchId="s-1" query="react developer" />)

    await user.click(screen.getByRole('button', { name: /save search/i }))
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(mockSaveSearch).toHaveBeenCalledWith({
      searchId: 's-1',
      name: 'react developer',
    })
  })

  it('calls onSaved callback after successful save', async () => {
    const onSaved = vi.fn()
    const user = userEvent.setup()
    render(<SaveSearchButton searchId="s-1" query="react developer" onSaved={onSaved} />)

    await user.click(screen.getByRole('button', { name: /save search/i }))
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled()
    })
  })

  it('closes dialog after successful save', async () => {
    const user = userEvent.setup()
    render(<SaveSearchButton searchId="s-1" query="react developer" />)

    await user.click(screen.getByRole('button', { name: /save search/i }))
    expect(screen.getByText('Save Search')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(screen.queryByText('Save Search')).not.toBeInTheDocument()
    })
  })
})

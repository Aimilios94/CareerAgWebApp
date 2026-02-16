import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProfileEditForm } from '../ProfileEditForm'

describe('ProfileEditForm', () => {
  const mockProfileData = {
    fullName: 'John Doe',
    jobTitle: 'Software Engineer',
  }

  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders form fields with initial values', () => {
    render(
      <ProfileEditForm
        initialData={mockProfileData}
        onSave={mockOnSave}
      />
    )

    const fullNameInput = screen.getByLabelText(/full name/i)
    const jobTitleInput = screen.getByLabelText(/job title/i)

    expect(fullNameInput).toHaveValue('John Doe')
    expect(jobTitleInput).toHaveValue('Software Engineer')
  })

  it('renders empty inputs when initialData has null values', () => {
    render(
      <ProfileEditForm
        initialData={{ fullName: null, jobTitle: null }}
        onSave={mockOnSave}
      />
    )

    const fullNameInput = screen.getByLabelText(/full name/i)
    const jobTitleInput = screen.getByLabelText(/job title/i)

    expect(fullNameInput).toHaveValue('')
    expect(jobTitleInput).toHaveValue('')
  })

  it('calls onSave with updated values on submit', async () => {
    const user = userEvent.setup()
    mockOnSave.mockResolvedValueOnce(undefined)

    render(
      <ProfileEditForm
        initialData={mockProfileData}
        onSave={mockOnSave}
      />
    )

    const fullNameInput = screen.getByLabelText(/full name/i)
    const jobTitleInput = screen.getByLabelText(/job title/i)
    const submitButton = screen.getByRole('button', { name: /save/i })

    // Clear and type new values
    await user.clear(fullNameInput)
    await user.type(fullNameInput, 'Jane Smith')
    await user.clear(jobTitleInput)
    await user.type(jobTitleInput, 'Senior Developer')

    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        fullName: 'Jane Smith',
        jobTitle: 'Senior Developer',
      })
    })
  })

  it('shows loading state when isLoading is true', () => {
    render(
      <ProfileEditForm
        initialData={mockProfileData}
        onSave={mockOnSave}
        isLoading={true}
      />
    )

    const submitButton = screen.getByRole('button', { name: /saving/i })
    expect(submitButton).toBeInTheDocument()
  })

  it('disables inputs and button when loading', () => {
    render(
      <ProfileEditForm
        initialData={mockProfileData}
        onSave={mockOnSave}
        isLoading={true}
      />
    )

    const fullNameInput = screen.getByLabelText(/full name/i)
    const jobTitleInput = screen.getByLabelText(/job title/i)
    const submitButton = screen.getByRole('button', { name: /saving/i })

    expect(fullNameInput).toBeDisabled()
    expect(jobTitleInput).toBeDisabled()
    expect(submitButton).toBeDisabled()
  })

  it('updates input values on change', async () => {
    const user = userEvent.setup()

    render(
      <ProfileEditForm
        initialData={mockProfileData}
        onSave={mockOnSave}
      />
    )

    const fullNameInput = screen.getByLabelText(/full name/i)

    await user.clear(fullNameInput)
    await user.type(fullNameInput, 'Updated Name')

    expect(fullNameInput).toHaveValue('Updated Name')
  })

  it('does not call onSave with empty fullName', async () => {
    const user = userEvent.setup()

    render(
      <ProfileEditForm
        initialData={mockProfileData}
        onSave={mockOnSave}
      />
    )

    const fullNameInput = screen.getByLabelText(/full name/i)
    const submitButton = screen.getByRole('button', { name: /save/i })

    await user.clear(fullNameInput)
    await user.click(submitButton)

    expect(mockOnSave).not.toHaveBeenCalled()
  })

  it('handles form submission via Enter key', async () => {
    const user = userEvent.setup()
    mockOnSave.mockResolvedValueOnce(undefined)

    render(
      <ProfileEditForm
        initialData={mockProfileData}
        onSave={mockOnSave}
      />
    )

    const fullNameInput = screen.getByLabelText(/full name/i)

    await user.click(fullNameInput)
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        fullName: 'John Doe',
        jobTitle: 'Software Engineer',
      })
    })
  })
})
